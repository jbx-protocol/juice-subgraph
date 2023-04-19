import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { DistributeToPayoutModEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v1USDPriceForEth } from "../../prices/v1Prices";

const pv = PV.PV1;

export function handleV1DistributeToPayoutMod(
  event: ethereum.Event,
  projectId: BigInt,
  fundingCycleId: BigInt,
  modProjectId: BigInt,
  modBeneficiary: Address,
  modAllocator: Address,
  modPreferUnstaked: boolean,
  modCut: BigInt,
  caller: Address,
  terminal: Bytes
): void {
  const distributeToPayoutModEvent = new DistributeToPayoutModEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  distributeToPayoutModEvent.projectId = projectId.toI32();
  distributeToPayoutModEvent.tapEvent = idForProjectTx(projectId, pv, event);
  distributeToPayoutModEvent.project = idForProject(projectId, pv);
  distributeToPayoutModEvent.caller = caller;
  distributeToPayoutModEvent.from = event.transaction.from;
  distributeToPayoutModEvent.projectId = projectId.toI32();
  distributeToPayoutModEvent.fundingCycleId = fundingCycleId;
  distributeToPayoutModEvent.modProjectId = modProjectId.toI32();
  distributeToPayoutModEvent.modBeneficiary = modBeneficiary;
  distributeToPayoutModEvent.modAllocator = modAllocator;
  distributeToPayoutModEvent.modPreferUnstaked = modPreferUnstaked;
  distributeToPayoutModEvent.modCut = modCut;
  distributeToPayoutModEvent.modCutUSD = v1USDPriceForEth(modCut);
  distributeToPayoutModEvent.timestamp = event.block.timestamp.toI32();
  distributeToPayoutModEvent.txHash = event.transaction.hash;

  distributeToPayoutModEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    distributeToPayoutModEvent.id,
    pv,
    ProjectEventKey.distributeToPayoutModEvent,
    terminal,
    caller
  );
}
