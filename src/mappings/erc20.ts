import { BigInt } from "@graphprotocol/graph-ts";

import { Participant, Project } from "../../generated/schema";
import { Transfer } from "../../generated/templates/TreasuryToken/ERC20";
import { idForParticipant, updateBalance } from "../utils";

export function handleProjectERC20Transfer(
  projectId: BigInt,
  event: Transfer
): void {
  let sender = Participant.load(idForParticipant(projectId, event.params.from));
  if (sender) {
    sender.unstakedBalance = sender.unstakedBalance.minus(event.params.value);

    updateBalance(sender);

    sender.save();
  }

  let receiverId = idForParticipant(projectId, event.params.to);
  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = new Participant(receiverId);

    let project = Project.load(projectId.toString());
    if (project) receiver.project = project.id;

    receiver.wallet = event.params.to;
    receiver.stakedBalance = BigInt.fromString("0");
    receiver.unstakedBalance = BigInt.fromString("0");
    receiver.totalPaid = BigInt.fromString("0");
    receiver.lastPaidTimestamp = BigInt.fromString("0");
  }
  receiver.unstakedBalance = receiver.unstakedBalance.plus(event.params.value);

  updateBalance(receiver);

  receiver.save();
}
