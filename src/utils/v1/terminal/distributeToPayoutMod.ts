import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DistributeToPayoutModEvent } from "../../../../generated/schema";
import { DistributeToPayoutModModStruct } from "../../../../generated/TerminalV1/TerminalV1";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v1USDPriceForEth } from "../../prices";

const pv = PV.PV1;

export function handleV1DistributeToPayoutMod(
  event: ethereum.Event,
  projectId: BigInt,
  fundingCycleId: BigInt,
  mod: DistributeToPayoutModModStruct,
  modCut: BigInt,
  caller: Address,
  terminal: Address
): void {
  const distributeToPayoutModEvent = new DistributeToPayoutModEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  distributeToPayoutModEvent.projectId = projectId.toI32();
  distributeToPayoutModEvent.tapEvent = idForProjectTx(projectId, pv, event);
  distributeToPayoutModEvent.project = idForProject(projectId, pv);
  distributeToPayoutModEvent.caller = event.transaction.from;
  distributeToPayoutModEvent.projectId = projectId.toI32();
  distributeToPayoutModEvent.fundingCycleId = fundingCycleId;
  distributeToPayoutModEvent.modProjectId = mod.projectId.toI32();
  distributeToPayoutModEvent.modBeneficiary = mod.beneficiary;
  distributeToPayoutModEvent.modAllocator = mod.allocator;
  distributeToPayoutModEvent.modPreferUnstaked = mod.preferUnstaked;
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
    caller,
    terminal
  );
}
