import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { DistributeToTicketModEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV1;

export function handleV1DistributeToTicketMod(
  event: ethereum.Event,
  projectId: BigInt,
  fundingCycleId: BigInt,
  modBeneficiary: Address,
  modPreferUnstaked: boolean,
  modCut: BigInt,
  caller: Address,
  terminal: Bytes
): void {
  const distributeToTicketModEvent = new DistributeToTicketModEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  // PrintReservesEvent is created in same tx, and we can load it by using an idForProjectTx without using logIndex
  distributeToTicketModEvent.printReservesEvent = idForProjectTx(
    projectId,
    pv,
    event
  );
  distributeToTicketModEvent.caller = caller;
  distributeToTicketModEvent.from = event.transaction.from;
  distributeToTicketModEvent.modBeneficiary = modBeneficiary;
  distributeToTicketModEvent.modPreferUnstaked = modPreferUnstaked;
  distributeToTicketModEvent.modCut = modCut;
  distributeToTicketModEvent.projectId = projectId.toI32();
  distributeToTicketModEvent.fundingCycleId = fundingCycleId;
  distributeToTicketModEvent.txHash = event.transaction.hash;
  distributeToTicketModEvent.timestamp = event.block.timestamp.toI32();
  distributeToTicketModEvent.project = idForProject(projectId, pv);

  distributeToTicketModEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    distributeToTicketModEvent.id,
    pv,
    ProjectEventKey.distributeToTicketModEvent,
    terminal,
    caller
  );
}
