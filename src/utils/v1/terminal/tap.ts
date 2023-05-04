import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Project, TapEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v1USDPriceForEth } from "../../prices/v1Prices";

const pv = PV.PV1;

export function handleV1Tap(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  beneficiaryTransferAmount: BigInt,
  govFeeAmount: BigInt,
  netTransferAmount: BigInt,
  beneficiary: Address,
  currency: BigInt,
  fundingCycleId: BigInt,
  caller: Address,
  terminal: Bytes
): void {
  const tapEvent = new TapEvent(idForProjectTx(projectId, pv, event));

  const idOfProject = idForProject(projectId, pv);

  const amountUSD = v1USDPriceForEth(amount);
  const beneficiaryTransferAmountUSD = v1USDPriceForEth(
    beneficiaryTransferAmount
  );
  const govFeeAmountUSD = v1USDPriceForEth(govFeeAmount);
  const netTransferAmountUSD = v1USDPriceForEth(netTransferAmount);

  if (tapEvent) {
    tapEvent.amount = amount;
    tapEvent.amountUSD = amountUSD;
    tapEvent.beneficiary = beneficiary;
    tapEvent.beneficiaryTransferAmount = beneficiaryTransferAmount;
    tapEvent.beneficiaryTransferAmountUSD = beneficiaryTransferAmountUSD;
    tapEvent.caller = caller;
    tapEvent.from = event.transaction.from;
    tapEvent.currency = currency;
    tapEvent.fundingCycleId = fundingCycleId;
    tapEvent.govFeeAmount = govFeeAmount;
    tapEvent.govFeeAmountUSD = govFeeAmountUSD;
    tapEvent.netTransferAmount = netTransferAmount;
    tapEvent.netTransferAmountUSD = netTransferAmountUSD;
    tapEvent.project = idOfProject;
    tapEvent.projectId = projectId.toI32();
    tapEvent.timestamp = event.block.timestamp.toI32();
    tapEvent.txHash = event.transaction.hash;
    tapEvent.save();

    saveNewProjectTerminalEvent(
      event,
      projectId,
      tapEvent.id,
      pv,
      ProjectEventKey.tapEvent,
      terminal,
      caller
    );
  }

  const project = Project.load(idOfProject);
  if (project) {
    project.currentBalance = project.currentBalance
      .minus(govFeeAmount)
      .minus(netTransferAmount);
    project.save();
  }
}
