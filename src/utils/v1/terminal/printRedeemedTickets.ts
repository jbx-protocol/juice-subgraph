import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { MintTokensEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV1;

export function handleV1PrintRedeemedTickets(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  beneficiary: Address,
  memo: string,
  caller: Address,
  terminal: Bytes
): void {
  /**
   * Note: Receiver balance is updated in the ticketBooth event handler.
   *
   * TBH the only reason to do this logic here instead of ticketBooth
   * is to make use of the `memo` field
   */

  const mintTokensEvent = new MintTokensEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  mintTokensEvent.pv = pv.toString();
  mintTokensEvent.projectId = projectId.toI32();
  mintTokensEvent.amount = amount;
  mintTokensEvent.beneficiary = beneficiary;
  mintTokensEvent.caller = caller;
  mintTokensEvent.from = event.transaction.from;
  mintTokensEvent.memo = memo;
  mintTokensEvent.project = idForProject(projectId, pv);
  mintTokensEvent.timestamp = event.block.timestamp.toI32();
  mintTokensEvent.txHash = event.transaction.hash;
  mintTokensEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    mintTokensEvent.id,
    pv,
    ProjectEventKey.mintTokensEvent,
    terminal,
    caller
  );
}
