import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { Participant, Project } from "../../../../generated/schema";
import { PV } from "../../../enums";
import {
  newParticipant,
  updateParticipantBalance,
} from "../../entities/participant";
import { idForParticipant, idForProject } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Transfer(
  projectId: BigInt,
  holder: Address,
  recipient: Address,
  amount: BigInt
): void {
  const idOfProject = idForProject(projectId, pv);
  const project = Project.load(idOfProject);
  if (!project) {
    log.error("[handleV2V3Transfer] Missing project. ID:{}", [
      idForProject(projectId, pv),
    ]);
    return;
  }

  const sender = Participant.load(idForParticipant(projectId, pv, holder));
  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(amount);

    updateParticipantBalance(sender);

    sender.save();
  }

  const receiverId = idForParticipant(projectId, pv, recipient);
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = newParticipant(pv, projectId, holder);
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(amount);

  updateParticipantBalance(receiver);

  receiver.save();
}
