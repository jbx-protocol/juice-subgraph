import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { DistributeToReservedTokenSplitEvent } from "../../../../generated/schema";
import { DistributeToReservedTokenSplitSplitStruct } from "../../../../generated/V3JBController/JBController";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3DistributeReservedTokenSplit(
  event: ethereum.Event,
  projectId: BigInt,
  tokenCount: BigInt,
  split: DistributeToReservedTokenSplitSplitStruct,
  caller: Address
): void {
  const distributeReservedTokenSplitEvent = new DistributeToReservedTokenSplitEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  // The DistributeReservedTokensEvent will be created in the same TX, so we can generate the event ID here without using logIndex
  distributeReservedTokenSplitEvent.distributeReservedTokensEvent = idForProjectTx(
    projectId,
    pv,
    event
  );
  distributeReservedTokenSplitEvent.project = idForProject(projectId, pv);
  distributeReservedTokenSplitEvent.projectId = projectId.toI32();
  distributeReservedTokenSplitEvent.txHash = event.transaction.hash;
  distributeReservedTokenSplitEvent.timestamp = event.block.timestamp.toI32();
  distributeReservedTokenSplitEvent.caller = event.transaction.from;
  distributeReservedTokenSplitEvent.tokenCount = tokenCount;
  distributeReservedTokenSplitEvent.allocator = split.allocator;
  distributeReservedTokenSplitEvent.beneficiary = split.beneficiary;
  distributeReservedTokenSplitEvent.lockedUntil = split.lockedUntil.toI32();
  distributeReservedTokenSplitEvent.percent = split.percent.toI32();
  distributeReservedTokenSplitEvent.preferClaimed = split.preferClaimed;
  distributeReservedTokenSplitEvent.splitProjectId = split.projectId.toI32();
  distributeReservedTokenSplitEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    distributeReservedTokenSplitEvent.id,
    pv,
    ProjectEventKey.distributeToReservedTokenSplitEvent,
    caller
  );
}
