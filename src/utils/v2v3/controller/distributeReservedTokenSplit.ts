import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { DistributeToReservedTokenSplitEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3DistributeReservedTokenSplit(
  event: ethereum.Event,
  projectId: BigInt,
  tokenCount: BigInt,
  allocator: Address,
  beneficiary: Address,
  lockedUntil: BigInt,
  percent: BigInt,
  preferClaimed: boolean,
  splitProjectId: BigInt,
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
  distributeReservedTokenSplitEvent.caller = caller;
  distributeReservedTokenSplitEvent.from = event.transaction.from;
  distributeReservedTokenSplitEvent.tokenCount = tokenCount;
  distributeReservedTokenSplitEvent.allocator = allocator;
  distributeReservedTokenSplitEvent.beneficiary = beneficiary;
  distributeReservedTokenSplitEvent.lockedUntil = lockedUntil.toI32();
  distributeReservedTokenSplitEvent.percent = percent.toI32();
  distributeReservedTokenSplitEvent.preferClaimed = preferClaimed;
  distributeReservedTokenSplitEvent.splitProjectId = splitProjectId.toI32();
  distributeReservedTokenSplitEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    distributeReservedTokenSplitEvent.id,
    pv,
    ProjectEventKey.distributeToReservedTokenSplitEvent,
  );
}
