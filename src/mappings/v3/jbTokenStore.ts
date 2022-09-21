import { BigInt, DataSourceContext, log } from "@graphprotocol/graph-ts";

import {
  Burn,
  Claim,
  Issue,
  Mint,
  Transfer,
} from "../../../generated/V3JBTokenStore/JBTokenStore";
import {
  DeployedERC20Event,
  Participant,
  Project,
  ProtocolV3Log,
} from "../../../generated/schema";
import { ERC20 } from "../../../generated/templates";
import { PROTOCOL_ID } from "../../constants";
import { CV, ProjectEventKey } from "../../types";
import {
  newParticipant,
  newProtocolV3Log,
  saveNewProjectEvent,
  updateParticipantBalance,
  updateProtocolEntity,
} from "../../utils/entity";
import {
  idForParticipant,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";

const cv: CV = "3";

export function handleBurn(event: Burn): void {
  const holderId = idForParticipant(
    event.params.projectId,
    cv,
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
    idForParticipant(event.params.projectId, cv, event.params.holder)
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
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);

  if (!project) {
    log.error("[handleIssue] Missing project. ID:{}", [
      idForProject(event.params.projectId, cv),
    ]);
    return;
  }

  const deployedERC20Event = new DeployedERC20Event(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (deployedERC20Event) {
    deployedERC20Event.project = project.id;
    deployedERC20Event.projectId = project.projectId;
    deployedERC20Event.cv = cv;
    deployedERC20Event.symbol = event.params.symbol;
    deployedERC20Event.address = event.params.token;
    deployedERC20Event.timestamp = event.block.timestamp.toI32();
    deployedERC20Event.txHash = event.transaction.hash;
    deployedERC20Event.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      deployedERC20Event.id,
      cv,
      ProjectEventKey.deployedERC20Event
    );
  }

  let protocolV3Log = ProtocolV3Log.load(PROTOCOL_ID);
  if (!protocolV3Log) protocolV3Log = newProtocolV3Log();
  if (protocolV3Log) {
    protocolV3Log.erc20Count = protocolV3Log.erc20Count + 1;
    protocolV3Log.save();
  }
  updateProtocolEntity();

  const erc20Context = new DataSourceContext();
  erc20Context.setI32("projectId", event.params.projectId.toI32());
  erc20Context.setString("cv", "2");
  ERC20.createWithContext(event.params.token, erc20Context);
}

export function handleMint(event: Mint): void {
  // Only handle updating unclaimed token balance
  if (event.params.preferClaimedTokens) return;

  const receiverId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.holder
  );
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = newParticipant(cv, event.params.projectId, event.params.holder);
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();
}

export function handleTransfer(event: Transfer): void {
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleTransfer] Missing project. ID:{}", [
      idForProject(event.params.projectId, cv),
    ]);
    return;
  }

  const sender = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );
  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);

    updateParticipantBalance(sender);

    sender.save();
  }

  const receiverId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.recipient
  );
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = newParticipant(cv, event.params.projectId, event.params.holder);
  }
  if (!receiver) return;

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();
}
