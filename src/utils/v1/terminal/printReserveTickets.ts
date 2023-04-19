import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { PrintReservesEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV1;

export function handleV1PrintReserveTickets(
  event: ethereum.Event,
  projectId: BigInt,
  beneficiary: Address,
  beneficiaryTicketAmount: BigInt,
  count: BigInt,
  fundingCycleId: BigInt,
  caller: Address,
  terminal: Bytes
): void {
  const idOfProject = idForProject(projectId, pv);
  const printReserveEvent = new PrintReservesEvent(
    idForProjectTx(projectId, pv, event)
  );
  printReserveEvent.projectId = projectId.toI32();
  printReserveEvent.beneficiary = beneficiary;
  printReserveEvent.beneficiaryTicketAmount = beneficiaryTicketAmount;
  printReserveEvent.caller = caller;
  printReserveEvent.from = event.transaction.from;
  printReserveEvent.count = count;
  printReserveEvent.fundingCycleId = fundingCycleId;
  printReserveEvent.project = idOfProject;
  printReserveEvent.timestamp = event.block.timestamp.toI32();
  printReserveEvent.txHash = event.transaction.hash;
  printReserveEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    printReserveEvent.id,
    pv,
    ProjectEventKey.printReservesEvent,
    terminal,
    caller
  );
}
