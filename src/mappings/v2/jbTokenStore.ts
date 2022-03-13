import { BigInt } from "@graphprotocol/graph-ts";
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
} from "../../../generated/schema";
import { CV } from "../../types";
import {
  idForParticipant,
  idForProject,
  idForProjectEvent,
  updateBalance,
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

  deployedERC20Event.project = project.id;
  deployedERC20Event.symbol = event.params.symbol;
  deployedERC20Event.deployedAtBlockNum = event.block.number;
  deployedERC20Event.address = event.params.token;

  deployedERC20Event.save();

  let projectEvent = new ProjectEvent(
    idForProjectEvent(
      event.params.projectId,
      cv,
      event.transaction.hash,
      event.transactionLogIndex
    )
  );
  projectEvent.timestamp = event.block.timestamp;
  projectEvent.deployedERC20Event = deployedERC20Event.id;
  projectEvent.project = projectId;
  projectEvent.save();
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

export function handleTransfer(event: Transfer): void {}
