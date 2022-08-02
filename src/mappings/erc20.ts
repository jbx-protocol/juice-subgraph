import { BigInt, dataSource } from "@graphprotocol/graph-ts";

import { Participant } from "../../generated/schema";
import { Transfer } from "../../generated/templates/ERC20/ERC20";
import { newParticipant, updateParticipantBalance } from "../utils/entity";
import { idForParticipant } from "../utils/ids";

export function handleERC20Transfer(event: Transfer): void {
  const context = dataSource.context();
  const projectId = BigInt.fromI32(context.getI32("projectId"));
  const cv = context.getString("cv");

  let sender = Participant.load(
    idForParticipant(projectId, cv, event.params.from)
  );

  if (sender) {
    sender.unstakedBalance = sender.unstakedBalance.minus(event.params.value);

    updateParticipantBalance(sender);

    sender.save();
  }

  const receiverId = idForParticipant(projectId, cv, event.params.to);
  let receiver = Participant.load(receiverId);
  if (!receiver) receiver = newParticipant(cv, projectId, event.params.to);
  if (!receiver) return;

  receiver.unstakedBalance = receiver.unstakedBalance.plus(event.params.value);

  updateParticipantBalance(receiver);

  receiver.save();
}
