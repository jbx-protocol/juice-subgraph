import { BigInt } from "@graphprotocol/graph-ts";

import { Participant } from "../../generated/schema";
import { Print, Transfer } from "../../generated/TicketBooth/TicketBooth";
import { idForParticipant } from "../utils";

export function handlePrint(event: Print): void {
  let id = idForParticipant(event.params.projectId, event.params.holder);
  let participant = Participant.load(id);

  if (!participant) {
    participant = new Participant(id);
    participant.project = event.params.projectId.toString();
    participant.tokenBalance = new BigInt(0);
    participant.wallet = event.params.holder;
    participant.totalPaid = new BigInt(0);
    participant.lastPaidTimestamp = new BigInt(0);
    participant.receivedPreminedTokens = new BigInt(0);
  }

  participant.tokenBalance = participant.tokenBalance.plus(event.params.amount);

  participant.save();
}

export function handleTicketTransfer(event: Transfer): void {
  let sender = Participant.load(
    idForParticipant(event.params.projectId, event.params.holder)
  );
  if (sender) {
    sender.tokenBalance = sender.tokenBalance.minus(event.params.amount);
    sender.save();
  }

  let receiverId = idForParticipant(
    event.params.projectId,
    event.params.recipient
  );
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = event.params.projectId.toString();
    receiver.wallet = event.params.recipient;
    receiver.tokenBalance = new BigInt(0);
    receiver.totalPaid = new BigInt(0);
    receiver.lastPaidTimestamp = new BigInt(0);
    receiver.receivedPreminedTokens = new BigInt(0);
  }
  receiver.tokenBalance = receiver.tokenBalance.plus(event.params.amount);
  receiver.save();
}

// TODO create datasource from ERC20 template using token address available in V2 contracts
// export function handleTicketsIssue(event: Issue): void {}
