import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Project, RedeemEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v1USDPriceForEth } from "../../prices/v1Prices";

const pv = PV.PV1;

export function handleV1Redeem(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  returnAmount: BigInt,
  terminal: Bytes,
  beneficiary: Address,
  holder: Address,
  caller: Address
): void {
  const idOfProject = idForProject(projectId, pv);

  const redeemEvent = new RedeemEvent(
    idForProjectTx(projectId, pv, event, true)
  );
  const returnAmountUSD = v1USDPriceForEth(returnAmount);
  if (redeemEvent) {
    redeemEvent.projectId = projectId.toI32();
    redeemEvent.pv = pv.toString();
    redeemEvent.terminal = terminal;
    redeemEvent.amount = amount;
    redeemEvent.beneficiary = beneficiary;
    redeemEvent.caller = caller;
    redeemEvent.from = event.transaction.from;
    redeemEvent.holder = holder;
    redeemEvent.returnAmount = returnAmount;
    redeemEvent.returnAmountUSD = returnAmountUSD;
    redeemEvent.project = idOfProject;
    redeemEvent.timestamp = event.block.timestamp.toI32();
    redeemEvent.txHash = event.transaction.hash;
    redeemEvent.save();

    saveNewProjectTerminalEvent(
      event,
      projectId,
      redeemEvent.id,
      pv,
      ProjectEventKey.redeemEvent,
      terminal,
      caller
    );
  }

  const project = Project.load(idOfProject);
  if (project) {
    project.redeemVolume = project.redeemVolume.plus(returnAmount);
    const amountRedeemedUSD = v1USDPriceForEth(returnAmount);
    if (amountRedeemedUSD) {
      project.redeemVolumeUSD = project.redeemVolumeUSD.plus(
        amountRedeemedUSD
      );
    }
    project.currentBalance = project.currentBalance.minus(returnAmount);
    project.redeemCount = project.redeemCount + 1;
    project.save();
  }
}
