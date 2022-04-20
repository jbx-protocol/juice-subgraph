import { BigInt, DataSourceContext } from "@graphprotocol/graph-ts";

import {
  Burn,
  Claim,
  Issue,
  Mint,
  Transfer,
} from "../../../generated/JBTokenStore/JBTokenStore";
import {
  DeployedERC20Event,
  Participant,
  Project,
  ProjectEvent,
  ProtocolV2Log,
} from "../../../generated/schema";
import { ERC20 } from "../../../generated/templates";
import { CV } from "../../types";
import {
  idForParticipant,
  idForProject,
  idForProjectEvent,
  ProjectEventKey,
  protocolId,
  saveNewProjectEvent,
  updateBalance,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = 2;

export function handleBurn(event: Burn): void {
  let holderId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.holder
  );
  let participant = Participant.load(holderId);

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

  updateBalance(participant);

  participant.save();
}

export function handleClaim(event: Claim): void {
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.minus(
      event.params.amount
    );

    updateBalance(participant);

    participant.save();
  }
}

export function handleIssue(event: Issue): void {
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);

  if (!project) return;

  let deployedERC20Event = new DeployedERC20Event(
    projectId + "-" + event.params.symbol + "-" + event.block.number.toString()
  );
  if (deployedERC20Event) {
    deployedERC20Event.project = project.id;
    deployedERC20Event.symbol = event.params.symbol;
    deployedERC20Event.address = event.params.token;
    deployedERC20Event.timestamp = event.block.timestamp;
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

  let log = ProtocolV2Log.load(protocolId);
  if (!log) log = new ProtocolV2Log(protocolId);
  if (log) {
    log.erc20Count = log.erc20Count + 1;
    log.save();
  }
  updateProtocolEntity();

  let erc20Context = new DataSourceContext();
  erc20Context.setString("projectId", projectId);
  ERC20.createWithContext(event.params.token, erc20Context);
}

export function handleMint(event: Mint): void {
  // Only handle updating unclaimed token balances
  if (event.params.preferClaimedTokens) return;

  let receiverId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.holder
  );
  let projectId = idForProject(event.params.projectId, cv);
  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = projectId;
    receiver.wallet = event.params.holder;
    receiver.stakedBalance = BigInt.fromString("0");
    receiver.unstakedBalance = BigInt.fromString("0");
    receiver.totalPaid = BigInt.fromString("0");
    receiver.lastPaidTimestamp = BigInt.fromString("0");
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateBalance(receiver);

  receiver.save();
}

export function handleTransfer(event: Transfer): void {
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);

  if (!project) return;

  let sender = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);

    updateBalance(sender);

    sender.save();
  }

  let receiverId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.recipient
  );

  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = project.id;
    receiver.wallet = event.params.recipient;
    receiver.stakedBalance = BigInt.fromString("0");
    receiver.unstakedBalance = BigInt.fromString("0");
    receiver.totalPaid = BigInt.fromString("0");
    receiver.lastPaidTimestamp = BigInt.fromString("0");
  }

  if (!receiver) return;

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateBalance(receiver);

  receiver.save();
}
