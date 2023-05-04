import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { DistributePayoutsEvent, Project } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v3USDPriceForEth } from "../../prices/v3Prices";

const pv = PV.PV2;

export function handleV2V3DistributePayouts(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  beneficiary: Address,
  beneficiaryDistributionAmount: BigInt,
  beneficiaryDistributionAmountUSD: BigInt | null,
  distributedAmount: BigInt,
  distributedAmountUSD: BigInt | null,
  terminal: Bytes,
  caller: Address,
  fee: BigInt,
  fundingCycleConfiguration: BigInt,
  fundingCycleNumber: BigInt,
  memo: string | null = null
): void {
  const distributePayoutsEventId = idForProjectTx(projectId, pv, event);
  const distributePayoutsEvent = new DistributePayoutsEvent(
    distributePayoutsEventId
  );

  if (!distributePayoutsEvent) {
    log.error(
      "[handleV2V3DistributePayouts] Missing distributePayoutsEvent. ID:{}",
      [distributePayoutsEventId]
    );
    return;
  }

  const idOfProject = idForProject(projectId, pv);
  distributePayoutsEvent.project = idOfProject;
  distributePayoutsEvent.terminal = terminal;
  distributePayoutsEvent.projectId = projectId.toI32();
  distributePayoutsEvent.timestamp = event.block.timestamp.toI32();
  distributePayoutsEvent.txHash = event.transaction.hash;
  distributePayoutsEvent.amount = amount;
  distributePayoutsEvent.amountUSD = v3USDPriceForEth(amount);
  distributePayoutsEvent.beneficiary = beneficiary;
  distributePayoutsEvent.beneficiaryDistributionAmount = beneficiaryDistributionAmount;
  distributePayoutsEvent.beneficiaryDistributionAmountUSD = beneficiaryDistributionAmountUSD;
  distributePayoutsEvent.caller = caller;
  distributePayoutsEvent.from = event.transaction.from;
  distributePayoutsEvent.distributedAmount = distributedAmount;
  distributePayoutsEvent.distributedAmountUSD = distributedAmountUSD;
  distributePayoutsEvent.fee = fee;
  distributePayoutsEvent.feeUSD = v3USDPriceForEth(fee);
  distributePayoutsEvent.fundingCycleConfiguration = fundingCycleConfiguration;
  distributePayoutsEvent.fundingCycleNumber = fundingCycleNumber.toI32();
  distributePayoutsEvent.memo = memo;
  distributePayoutsEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    distributePayoutsEvent.id,
    pv,
    ProjectEventKey.distributePayoutsEvent,
    terminal,
    caller
  );

  const project = Project.load(idOfProject);
  if (!project) {
    log.error("[handleV2V3DistributePayouts] Missing project. ID:{}", [
      idOfProject,
    ]);
    return;
  }
  project.currentBalance = project.currentBalance.minus(distributedAmount);
  project.save();
}
