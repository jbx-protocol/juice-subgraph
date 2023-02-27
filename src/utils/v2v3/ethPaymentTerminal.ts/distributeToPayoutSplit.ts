import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { DistributeToPayoutSplitEvent } from "../../../../generated/schema";
import { DistributeToPayoutSplitSplitStruct } from "../../../../generated/V3JBETHPaymentTerminal/JBETHPaymentTerminal";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3DistributeToPayoutSplit(
  event: ethereum.Event,
  projectId: BigInt,
  terminal: Address,
  amount: BigInt,
  amountUSD: BigInt | null,
  domain: BigInt,
  group: BigInt,
  split: DistributeToPayoutSplitSplitStruct,
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
  distributePayoutSplitEvent.caller = event.transaction.from;
  distributePayoutSplitEvent.domain = domain;
  distributePayoutSplitEvent.group = group;
  distributePayoutSplitEvent.projectId = projectId.toI32();
  distributePayoutSplitEvent.splitProjectId = split.projectId.toI32();
  distributePayoutSplitEvent.allocator = split.allocator;
  distributePayoutSplitEvent.beneficiary = split.beneficiary;
  distributePayoutSplitEvent.lockedUntil = split.lockedUntil.toI32();
  distributePayoutSplitEvent.percent = split.percent.toI32();
  distributePayoutSplitEvent.preferClaimed = split.preferClaimed;
  distributePayoutSplitEvent.preferAddToBalance = split.preferAddToBalance;
  distributePayoutSplitEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    distributePayoutSplitEvent.id,
    pv,
    ProjectEventKey.distributeToPayoutSplitEvent,
    caller,
    terminal
  );
}
