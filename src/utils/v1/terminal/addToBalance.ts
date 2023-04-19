import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { AddToBalanceEvent, Project } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";
import { v1USDPriceForEth } from "../../prices/v1Prices";

const pv = PV.PV1;

export function handleV1AddToBalance(
  event: ethereum.Event,
  projectId: BigInt,
  value: BigInt,
  terminal: Bytes,
  caller: Address
): void {
  const addToBalance = new AddToBalanceEvent(
    idForProjectTx(projectId, pv, event, true)
  );
  const idOfProject = idForProject(projectId, pv);
  const project = Project.load(idOfProject);

  if (!project) {
    log.error("[handleV1AddToBalance] Missing project. ID:{}", [idOfProject]);
    return;
  }

  project.currentBalance = project.currentBalance.plus(value);
  project.save();

  if (addToBalance) {
    addToBalance.pv = pv.toString();
    addToBalance.terminal = terminal;
    addToBalance.projectId = projectId.toI32();
    addToBalance.amount = value;
    addToBalance.amountUSD = v1USDPriceForEth(value);
    addToBalance.from = event.transaction.from;
    addToBalance.caller = caller;
    addToBalance.project = idOfProject;
    addToBalance.timestamp = event.block.timestamp.toI32();
    addToBalance.txHash = event.transaction.hash;
    addToBalance.save();

    saveNewProjectTerminalEvent(
      event,
      projectId,
      addToBalance.id,
      pv,
      ProjectEventKey.addToBalanceEvent,
      terminal,
      caller
    );
  }
}
