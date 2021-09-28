import { BigInt } from "@graphprotocol/graph-ts";

import { Participant } from "../../generated/schema";
import { Transfer } from "../../generated/templates/TreasuryToken/ERC20";
import { idForParticipant } from "../utils";

export function handleProjectERC20Transfer(
  projectId: BigInt,
  event: Transfer
): void {
  let sender = Participant.load(idForParticipant(projectId, event.params.from));
  if (sender) {
    sender.tokenBalance = sender.tokenBalance.minus(event.params.value);
    sender.save();
  }

  let receiverId = idForParticipant(projectId, event.params.to);
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = projectId.toHexString();
    receiver.wallet = event.params.to;
    receiver.tokenBalance = new BigInt(0);
    receiver.totalPaid = new BigInt(0);
    receiver.lastPaidTimestamp = new BigInt(0);
    receiver.receivedPreminedTokens = new BigInt(0);
  }
  receiver.tokenBalance = receiver.tokenBalance.plus(event.params.value);
  receiver.save();
}
