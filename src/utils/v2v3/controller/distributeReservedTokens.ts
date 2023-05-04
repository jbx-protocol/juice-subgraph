import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { DistributeReservedTokensEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3DistributeReservedTokens(
  event: ethereum.Event,
  projectId: BigInt,
  fundingCycleNumber: BigInt,
  beneficiary: Address,
  tokenCount: BigInt,
  beneficiaryTokenCount: BigInt,
  memo: string,
  caller: Address
): void {
  const distributeReservedTokensEvent = new DistributeReservedTokensEvent(
    idForProjectTx(projectId, pv, event)
  );

  distributeReservedTokensEvent.project = idForProject(projectId, pv);
  distributeReservedTokensEvent.projectId = projectId.toI32();
  distributeReservedTokensEvent.txHash = event.transaction.hash;
  distributeReservedTokensEvent.timestamp = event.block.timestamp.toI32();
  distributeReservedTokensEvent.fundingCycleNumber = fundingCycleNumber.toI32();
  distributeReservedTokensEvent.caller = caller;
  distributeReservedTokensEvent.from = event.transaction.from;
  distributeReservedTokensEvent.beneficiary = beneficiary;
  distributeReservedTokensEvent.tokenCount = tokenCount;
  distributeReservedTokensEvent.beneficiaryTokenCount = beneficiaryTokenCount;
  distributeReservedTokensEvent.memo = memo;
  distributeReservedTokensEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    distributeReservedTokensEvent.id,
    pv,
    ProjectEventKey.distributeReservedTokensEvent,
  );
}
