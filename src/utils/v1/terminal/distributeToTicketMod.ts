import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { DistributeToTicketModEvent } from "../../../../generated/schema";
import { DistributeToTicketModModStruct } from "../../../../generated/TerminalV1/TerminalV1";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV1;

export function handleV1DistributeToTicketMod(
  event: ethereum.Event,
  projectId: BigInt,
  fundingCycleId: BigInt,
  mod: DistributeToTicketModModStruct,
  modCut: BigInt,
  caller: Address,
  terminal: Address
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
  distributeToTicketModEvent.caller = event.transaction.from;
  distributeToTicketModEvent.modBeneficiary = mod.beneficiary;
  distributeToTicketModEvent.modPreferUnstaked = mod.preferUnstaked;
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
    caller,
    terminal
  );
}
