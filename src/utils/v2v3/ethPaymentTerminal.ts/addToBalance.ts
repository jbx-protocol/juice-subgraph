import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { AddToBalanceEvent, Project } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v3USDPriceForEth } from "../../prices/v3Prices";

const pv = PV.PV2;

export function handleV2V3AddToBalance(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  terminal: Bytes,
  memo: string,
  caller: Address
): void {
  const addToBalance = new AddToBalanceEvent(
    idForProjectTx(projectId, pv, event, true)
  );
  const idOfProject = idForProject(projectId, pv);
  const project = Project.load(idOfProject);

  if (!project) {
    log.error("[handleV2V3AddToBalance] Missing project. ID:{}", [idOfProject]);
    return;
  }

  project.currentBalance = project.currentBalance.plus(amount);
  project.save();

  if (addToBalance) {
    addToBalance.pv = pv.toString();
    addToBalance.terminal = terminal;
    addToBalance.projectId = projectId.toI32();
    addToBalance.amount = amount;
    addToBalance.amountUSD = v3USDPriceForEth(amount);
    addToBalance.caller = caller;
    addToBalance.from = event.transaction.from;
    addToBalance.project = idOfProject;
    addToBalance.note = memo;
    addToBalance.timestamp = event.block.timestamp.toI32();
    addToBalance.txHash = event.transaction.hash;
    addToBalance.save();

    saveNewProjectTerminalEvent(
      event,
      projectId,
      addToBalance.id,
      pv,
      ProjectEventKey.addToBalanceEvent,
      caller,
      terminal
    );
  }
}
