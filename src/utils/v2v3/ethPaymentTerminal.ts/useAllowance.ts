import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { UseAllowanceEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3UseAllowance(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  amountUSD: BigInt | null,
  distributedAmount: BigInt,
  distributedAmountUSD: BigInt | null,
  netDistributedamount: BigInt,
  netDistributedamountUSD: BigInt | null,
  beneficiary: Address,
  fundingCycleConfiguration: BigInt,
  fundingCycleNumber: BigInt,
  memo: string,
  caller: Address,
  terminal: Bytes
): void {
  const useAllowanceEventId = idForProjectTx(projectId, pv, event, true);
  const useAllowanceEvent = new UseAllowanceEvent(useAllowanceEventId);

  useAllowanceEvent.project = idForProject(projectId, pv);
  useAllowanceEvent.projectId = projectId.toI32();
  useAllowanceEvent.timestamp = event.block.timestamp.toI32();
  useAllowanceEvent.txHash = event.transaction.hash;
  useAllowanceEvent.amount = amount;
  useAllowanceEvent.amountUSD = amountUSD;
  useAllowanceEvent.beneficiary = beneficiary;
  useAllowanceEvent.caller = caller;
  useAllowanceEvent.from = event.transaction.from;
  useAllowanceEvent.distributedAmount = distributedAmount;
  useAllowanceEvent.distributedAmountUSD = distributedAmountUSD;
  useAllowanceEvent.fundingCycleConfiguration = fundingCycleConfiguration;
  useAllowanceEvent.fundingCycleNumber = fundingCycleNumber.toI32();
  useAllowanceEvent.memo = memo;
  useAllowanceEvent.netDistributedamount = netDistributedamount;
  useAllowanceEvent.netDistributedamountUSD = netDistributedamountUSD;
  useAllowanceEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    useAllowanceEvent.id,
    pv,
    ProjectEventKey.useAllowanceEvent,
    terminal,
    caller
  );
}
