import { BigInt } from "@graphprotocol/graph-ts";

import { Participant, Project } from "../../generated/schema";
import {
  Print,
  Redeem,
  Stake,
  Transfer,
  Unstake,
} from "../../generated/TicketBooth/TicketBooth";
import { erc20IsIndexed, idForParticipant, updateBalance } from "../utils";

export function handlePrint(event: Print): void {
  let projectId = event.params.projectId;
  let id = idForParticipant(projectId, event.params.holder);
  let participant = Participant.load(id);

  if (!participant) {
    let project = Project.load(projectId.toString());

    if (project) {
      participant = new Participant(id);
      participant.project = project.id;
      participant.stakedBalance = BigInt.fromString("0");
      participant.unstakedBalance = BigInt.fromString("0");
      participant.wallet = event.params.holder;
      participant.totalPaid = BigInt.fromString("0");
      participant.lastPaidTimestamp = BigInt.fromString("0");

      project.participantsCount = project.participantsCount.plus(
        BigInt.fromString("1")
      );
      project.save();
    }
  }

  if (event.params.preferUnstakedTickets) {
    if (!erc20IsIndexed(projectId)) {
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
  let projectId = event.params.projectId;

  let project = Project.load(projectId.toString());

  let sender = Participant.load(
    idForParticipant(projectId, event.params.holder)
  );

  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);

    updateBalance(sender);

    if (sender.balance.isZero()) {
      project.participantsCount = project.participantsCount.minus(
        BigInt.fromString("1")
      );
      project.save();
    }

    sender.save();
  }

  let receiverId = idForParticipant(projectId, event.params.recipient);

  let receiver = Participant.load(receiverId);

  if (!receiver) {
    let project = Project.load(projectId.toString());

    if (project) {
      receiver = new Participant(receiverId);
      receiver.project = project.id;
      receiver.wallet = event.params.recipient;
      receiver.stakedBalance = BigInt.fromString("0");
      receiver.unstakedBalance = BigInt.fromString("0");
      receiver.totalPaid = BigInt.fromString("0");
      receiver.lastPaidTimestamp = BigInt.fromString("0");

      project.participantsCount = project.participantsCount.plus(
        BigInt.fromString("1")
      );
      project.save();
    }
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateBalance(receiver);

  receiver.save();
}

export function handleUnstake(event: Unstake): void {
  let projectId = event.params.projectId;

  let participant = Participant.load(
    idForParticipant(projectId, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.minus(
      event.params.amount
    );

    if (!erc20IsIndexed(projectId)) {
      participant.unstakedBalance = participant.unstakedBalance.plus(
        event.params.amount
      );
    }

    updateBalance(participant);

    participant.save();
  }
}

export function handleStake(event: Stake): void {
  let projectId = event.params.projectId;

  let participant = Participant.load(
    idForParticipant(projectId, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.plus(
      event.params.amount
    );

    if (!erc20IsIndexed(projectId)) {
      participant.unstakedBalance = participant.unstakedBalance.minus(
        event.params.amount
      );
    }

    updateBalance(participant);

    participant.save();
  }
}

export function handleRedeem(event: Redeem): void {
  let projectId = event.params.projectId;

  let participant = Participant.load(
    idForParticipant(projectId, event.params.holder)
  );

  if (!participant) return;

  if (event.params.preferUnstaked) {
    if (participant.unstakedBalance.gt(event.params.amount)) {
      if (!erc20IsIndexed(projectId)) {
        participant.unstakedBalance = participant.unstakedBalance.minus(
          event.params.amount
        );
      }
    } else {
      if (!erc20IsIndexed(projectId)) {
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

      if (!erc20IsIndexed(projectId)) {
        participant.unstakedBalance = participant.unstakedBalance.minus(
          event.params.amount.minus(participant.stakedBalance)
        );
      }
    }
  }

  updateBalance(participant);

  if (participant.balance.isZero()) {
    let project = Project.load(projectId.toString());
    project.participantsCount = project.participantsCount.minus(
      BigInt.fromString("1")
    );
    project.save();
  }

  participant.save();
}
