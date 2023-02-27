import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { AddToBalanceEvent, Project } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v2USDPriceForEth } from "../../prices";

const pv = PV.PV2;

export function handleV2V3AddToBalance(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  terminal: Address,
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
    addToBalance.amountUSD = v2USDPriceForEth(amount);
    addToBalance.caller = event.transaction.from;
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
