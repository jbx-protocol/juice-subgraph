import { BigInt, DataSourceContext, log } from "@graphprotocol/graph-ts";

import {
  DeployedERC20Event,
  Participant,
  Project,
  ProtocolV2Log,
} from "../../../generated/schema";
import { ERC20 } from "../../../generated/templates";
import {
  Burn,
  Claim,
  Issue,
  Mint,
  Transfer,
} from "../../../generated/V2JBTokenStore/JBTokenStore";
import { PROTOCOL_ID } from "../../constants";
import { ProjectEventKey, Version } from "../../types";
import {
  newParticipant,
  updateParticipantBalance,
} from "../../utils/entities/participant";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import {
  newProtocolV2Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import {
  idForParticipant,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";

const pv: Version = "2";

export function handleBurn(event: Burn): void {
  const holderId = idForParticipant(
    event.params.projectId,
    pv,
    event.params.holder
  );
  const participant = Participant.load(holderId);

  if (!participant) return;

  if (event.params.preferClaimedTokens) {
    if (participant.unstakedBalance.lt(event.params.amount)) {
      participant.stakedBalance = participant.stakedBalance.minus(
        event.params.amount.minus(participant.unstakedBalance)
      );
    }
  } else {
    if (participant.stakedBalance.gt(event.params.amount)) {
      participant.stakedBalance = participant.stakedBalance.minus(
        event.params.amount
      );
    } else {
      participant.stakedBalance = BigInt.fromString("0");
    }
  }

  updateParticipantBalance(participant);

  participant.save();
}

export function handleClaim(event: Claim): void {
  const participant = Participant.load(
    idForParticipant(event.params.projectId, pv, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.minus(
      event.params.amount
    );

    updateParticipantBalance(participant);

    participant.save();
  }
}

export function handleIssue(event: Issue): void {
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);

  if (!project) {
    log.error("[handleIssue] Missing project. ID:{}", [
      idForProject(event.params.projectId, pv),
    ]);
    return;
  }

  const deployedERC20Event = new DeployedERC20Event(
    idForProjectTx(event.params.projectId, pv, event)
  );
  if (deployedERC20Event) {
    deployedERC20Event.project = project.id;
    deployedERC20Event.projectId = project.projectId;
    deployedERC20Event.pv = pv;
    deployedERC20Event.symbol = event.params.symbol;
    deployedERC20Event.address = event.params.token;
    deployedERC20Event.timestamp = event.block.timestamp.toI32();
    deployedERC20Event.txHash = event.transaction.hash;
    deployedERC20Event.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      deployedERC20Event.id,
      pv,
      ProjectEventKey.deployedERC20Event
    );
  }

  let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (!protocolV2Log) protocolV2Log = newProtocolV2Log();
  if (protocolV2Log) {
    protocolV2Log.erc20Count = protocolV2Log.erc20Count + 1;
    protocolV2Log.save();
  }
  updateProtocolEntity();

  const erc20Context = new DataSourceContext();
  erc20Context.setI32("projectId", event.params.projectId.toI32());
  erc20Context.setString("pv", pv);
  ERC20.createWithContext(event.params.token, erc20Context);
}

export function handleMint(event: Mint): void {
  /**
   * We're only concerned with updating unclaimed token balance.
   * "Claimed" ERC20 tokens will be handled separately.
   */
  if (event.params.preferClaimedTokens) return;

  const receiverId = idForParticipant(
    event.params.projectId,
    pv,
    event.params.holder
  );
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = newParticipant(pv, event.params.projectId, event.params.holder);
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();
}

export function handleTransfer(event: Transfer): void {
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleTransfer] Missing project. ID:{}", [
      idForProject(event.params.projectId, pv),
    ]);
    return;
  }

  const sender = Participant.load(
    idForParticipant(event.params.projectId, pv, event.params.holder)
  );
  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);

    updateParticipantBalance(sender);

    sender.save();
  }

  const receiverId = idForParticipant(
    event.params.projectId,
    pv,
    event.params.recipient
  );
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = newParticipant(pv, event.params.projectId, event.params.holder);
  }
  if (!receiver) return;

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();
}
