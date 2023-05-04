import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { MintTokensEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3MintTokens(
  event: ethereum.Event,
  projectId: BigInt,
  tokenCount: BigInt,
  beneficiary: Address,
  caller: Address,
  memo: string
): void {
  /**
   * Note: Receiver balance is updated in the JBTokenStore event handler.
   *
   * The only reason to do this logic in JBController instead of JBTokenStore
   * is to make use of the `memo` field
   */
  const mintTokensEvent = new MintTokensEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  mintTokensEvent.pv = pv.toString();
  mintTokensEvent.projectId = projectId.toI32();
  mintTokensEvent.amount = tokenCount;
  mintTokensEvent.beneficiary = beneficiary;
  mintTokensEvent.caller = caller;
  mintTokensEvent.from = event.transaction.from;
  mintTokensEvent.memo = memo;
  mintTokensEvent.project = idForProject(projectId, pv);
  mintTokensEvent.timestamp = event.block.timestamp.toI32();
  mintTokensEvent.txHash = event.transaction.hash;
  mintTokensEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    mintTokensEvent.id,
    pv,
    ProjectEventKey.mintTokensEvent,
  );
}
