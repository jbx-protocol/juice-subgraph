import { BigInt } from "@graphprotocol/graph-ts";

import {
  DeployedERC20Event,
  Participant,
  Project,
  ProtocolV1Log,
} from "../../../generated/schema";
import {
  Issue,
  Print,
  Redeem,
  Stake,
  Transfer,
  Unstake,
} from "../../../generated/TicketBooth/TicketBooth";
import { CV, ProjectEventKey } from "../../types";
import {
  erc20IsIndexed,
  idForParticipant,
  idForProject,
  protocolId,
  saveNewProjectEvent,
  updateBalance,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = 1;

export function handlePrint(event: Print): void {
  let projectId = idForProject(event.params.projectId, cv);
  let id = idForParticipant(event.params.projectId, cv, event.params.holder);
  let participant = Participant.load(id);
  let project = Project.load(projectId);

  if (!project) return;

  if (!participant) {
    participant = new Participant(id);
    participant.project = project.id;
    participant.stakedBalance = BigInt.fromString("0");
    participant.unstakedBalance = BigInt.fromString("0");
    participant.wallet = event.params.holder;
    participant.totalPaid = BigInt.fromString("0");
    participant.lastPaidTimestamp = BigInt.fromString("0");
  }

  if (!participant) return;

  if (event.params.preferUnstakedTickets) {
    if (!erc20IsIndexed(event.params.projectId)) {
      participant.unstakedBalance = participant.unstakedBalance.plus(
        event.params.amount
      );
    }
  } else {
    participant.stakedBalance = participant.stakedBalance.plus(
      event.params.amount
    );
  }

  updateBalance(participant);

  participant.save();
}

export function handleTicketTransfer(event: Transfer): void {
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

export function handleUnstake(event: Unstake): void {
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.minus(
      event.params.amount
    );

    if (!erc20IsIndexed(event.params.projectId)) {
      participant.unstakedBalance = participant.unstakedBalance.plus(
        event.params.amount
      );
    }

    updateBalance(participant);

    participant.save();
  }
}

export function handleStake(event: Stake): void {
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.plus(
      event.params.amount
    );

    if (!erc20IsIndexed(event.params.projectId)) {
      participant.unstakedBalance = participant.unstakedBalance.minus(
        event.params.amount
      );
    }

    updateBalance(participant);

    participant.save();
  }
}

export function handleRedeem(event: Redeem): void {
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (!participant) return;

  if (event.params.preferUnstaked) {
    if (participant.unstakedBalance.gt(event.params.amount)) {
      if (!erc20IsIndexed(event.params.projectId)) {
        participant.unstakedBalance = participant.unstakedBalance.minus(
          event.params.amount
        );
      }
    } else {
      if (!erc20IsIndexed(event.params.projectId)) {
        participant.unstakedBalance = BigInt.fromString("0");
      }

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

      if (!erc20IsIndexed(event.params.projectId)) {
        participant.unstakedBalance = participant.unstakedBalance.minus(
          event.params.amount.minus(participant.stakedBalance)
        );
      }
    }
  }

  updateBalance(participant);

  participant.save();
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

  let log = ProtocolV1Log.load(protocolId);
  if (!log) log = new ProtocolV1Log(protocolId);
  log.erc20Count = log.erc20Count + 1;
  log.save();
  updateProtocolEntity();
}
