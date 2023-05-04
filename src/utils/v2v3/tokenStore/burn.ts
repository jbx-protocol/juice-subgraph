import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { BurnEvent, Participant } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { updateParticipantBalance } from "../../entities/participant";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForParticipant, idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Burn(
  event: ethereum.Event,
  projectId: BigInt,
  holder: Address,
  caller: Address,
  amount: BigInt,
  preferClaimedTokens: boolean
): void {
  const holderId = idForParticipant(projectId, pv, holder);
  const participant = Participant.load(holderId);

  if (!participant) {
    log.error("[handleV2V3Claim] Missing participant. ID:{}", [holderId]);
    return;
  }

  let burnedStakedAmount = BigInt.fromString("0");

  // Only update stakedBalance, since erc20Balance will be updated by erc20 handler
  if (preferClaimedTokens) {
    if (participant.erc20Balance.lt(amount)) {
      burnedStakedAmount = amount.minus(participant.erc20Balance);
      participant.stakedBalance = participant.stakedBalance.minus(
        burnedStakedAmount
      );
    }
  } else {
    if (participant.stakedBalance.gt(amount)) {
      burnedStakedAmount = amount;
      participant.stakedBalance = participant.stakedBalance.minus(amount);
    } else {
      participant.stakedBalance = BigInt.fromString("0");
    }
  }

  updateParticipantBalance(participant);

  participant.save();

  const burnEvent = new BurnEvent(idForProjectTx(projectId, pv, event));
  burnEvent.holder = holder;
  burnEvent.project = idForProject(projectId, pv);
  burnEvent.projectId = projectId.toI32();
  burnEvent.pv = pv.toString();
  burnEvent.timestamp = event.block.timestamp.toI32();
  burnEvent.txHash = event.transaction.hash;
  burnEvent.amount = amount;
  burnEvent.stakedAmount = burnedStakedAmount;
  burnEvent.erc20Amount = BigInt.fromString("0");
  burnEvent.caller = caller;
  burnEvent.from = event.transaction.from;
  burnEvent.save();
  saveNewProjectEvent(
    event,
    projectId,
    burnEvent.id,
    pv,
    ProjectEventKey.burnEvent
  );
}
