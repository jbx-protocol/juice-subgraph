import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { Participant } from "../../../../generated/schema";
import { PV } from "../../../enums";
import { updateParticipantBalance } from "../../entities/participant";
import { idForParticipant } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Claim(
  projectId: BigInt,
  holder: Address,
  amount: BigInt
): void {
  const idOfParticipant = idForParticipant(projectId, pv, holder);
  const participant = Participant.load(idOfParticipant);

  if (!participant) {
    log.error("[handleV2V3Claim] Missing participant. ID:{}", [
      idOfParticipant,
    ]);
    return;
  }

  participant.stakedBalance = participant.stakedBalance.minus(amount);

  updateParticipantBalance(participant);

  participant.save();
}
