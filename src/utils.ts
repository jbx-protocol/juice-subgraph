import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Participant, Project } from "../generated/schema";
import { Transfer } from "../generated/templates/ERC20/ERC20";
import { indexedERC20s } from "./erc20/indexedERC20s";

export function idForParticipant(
  projectId: BigInt,
  walletAddress: Bytes
): string {
  return projectId.toString() + "-" + walletAddress.toHexString().toLowerCase();
}

export function erc20IsIndexed(projectId: BigInt): boolean {
  return indexedERC20s.includes(projectId.toString());
}

export function updateBalance(participant: Participant): void {
  participant.balance = participant.unstakedBalance.plus(
    participant.stakedBalance
  );
}

export function handleProjectERC20Transfer(
  projectId: BigInt,
  event: Transfer
): void {
  let sender = Participant.load(idForParticipant(projectId, event.params.from));
  let project = Project.load(projectId.toString());

  if (!project) return;

  if (sender) {
    sender.unstakedBalance = sender.unstakedBalance.minus(event.params.value);

    updateBalance(sender);

    // Decrement holdersCount if sender sent the rest of their tokens
    if (
      sender.balance.isZero() &&
      event.params.to !== event.params.from &&
      project
    ) {
      project.holdersCount = project.holdersCount.minus(BigInt.fromString("1"));
      project.save();
    }

    sender.save();
  }

  let receiverId = idForParticipant(projectId, event.params.to);
  let receiver = Participant.load(receiverId);

  // Increment holdersCount if receiver is new or had 0 balance and received >0 tokens
  if (
    !event.params.value.isZero() &&
    (!receiver || receiver.balance.isZero())
  ) {
    project.holdersCount = project.holdersCount.plus(BigInt.fromString("1"));
    project.save();
  }

  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = project.id;
    receiver.wallet = event.params.to;
    receiver.stakedBalance = BigInt.fromString("0");
    receiver.unstakedBalance = BigInt.fromString("0");
    receiver.totalPaid = BigInt.fromString("0");
    receiver.lastPaidTimestamp = BigInt.fromString("0");
  }

  if (!receiver) return;

  receiver.unstakedBalance = receiver.unstakedBalance.plus(event.params.value);

  updateBalance(receiver);

  receiver.save();
}
