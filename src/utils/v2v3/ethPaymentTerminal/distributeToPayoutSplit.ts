import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { DistributeToPayoutSplitEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3DistributeToPayoutSplit(
  event: ethereum.Event,
  projectId: BigInt,
  terminal: Bytes,
  amount: BigInt,
  amountUSD: BigInt | null,
  domain: BigInt,
  group: BigInt,
  splitProjectId: BigInt,
  splitAllocator: Address,
  splitBeneficiary: Address,
  splitLockedUntil: BigInt,
  splitPercent: BigInt,
  splitPreferClaimed: boolean,
  splitPreferAddToBalance: boolean,
  caller: Address
): void {
  const idOfProject = idForProject(projectId, pv);
  const distributePayoutSplitEventId = idForProjectTx(
    projectId,
    pv,
    event,
    true
  );
  const distributePayoutSplitEvent = new DistributeToPayoutSplitEvent(
    distributePayoutSplitEventId
  );

  if (!distributePayoutSplitEvent) {
    log.error(
      "[handleV2V3DistributeToPayoutSplit] Missing distributePayoutSplitEvent. ID:{}",
      [distributePayoutSplitEventId]
    );
    return;
  }
  distributePayoutSplitEvent.distributePayoutsEvent = idForProjectTx(
    projectId,
    pv,
    event
  );
  distributePayoutSplitEvent.project = idOfProject;
  distributePayoutSplitEvent.terminal = terminal;
  distributePayoutSplitEvent.txHash = event.transaction.hash;
  distributePayoutSplitEvent.timestamp = event.block.timestamp.toI32();
  distributePayoutSplitEvent.amount = amount;
  distributePayoutSplitEvent.amountUSD = amountUSD;
  distributePayoutSplitEvent.caller = caller;
  distributePayoutSplitEvent.from = event.transaction.from;
  distributePayoutSplitEvent.domain = domain;
  distributePayoutSplitEvent.group = group;
  distributePayoutSplitEvent.projectId = projectId.toI32();
  distributePayoutSplitEvent.splitProjectId = splitProjectId.toI32();
  distributePayoutSplitEvent.allocator = splitAllocator;
  distributePayoutSplitEvent.beneficiary = splitBeneficiary;
  distributePayoutSplitEvent.lockedUntil = splitLockedUntil.toI32();
  distributePayoutSplitEvent.percent = splitPercent.toI32();
  distributePayoutSplitEvent.preferClaimed = splitPreferClaimed;
  distributePayoutSplitEvent.preferAddToBalance = splitPreferAddToBalance;
  distributePayoutSplitEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    distributePayoutSplitEvent.id,
    pv,
    ProjectEventKey.distributeToPayoutSplitEvent,
    terminal,
    caller
  );
}
