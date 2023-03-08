import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Participant } from "../../../../generated/schema";
import { PV } from "../../../enums";
import {
  newParticipant,
  updateParticipantBalance,
} from "../../entities/participant";
import { idForParticipant } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Mint(
  projectId: BigInt,
  preferClaimedTokens: boolean,
  holder: Address,
  amount: BigInt
): void {
  /**
   * We're only concerned with updating unclaimed token balance.
   * "Claimed" ERC20 tokens will be handled separately.
   */
  if (preferClaimedTokens) return;

  const receiverId = idForParticipant(projectId, pv, holder);
  let receiver = Participant.load(receiverId);
  if (!receiver) {
    receiver = newParticipant(pv, projectId, holder);
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(amount);

  updateParticipantBalance(receiver);

  receiver.save();
}
