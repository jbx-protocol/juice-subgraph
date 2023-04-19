import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { SetFundAccessConstraintsEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3SetFundAccessConstraints(
  event: ethereum.Event,
  projectId: BigInt,
  caller: Address,
  distributionLimit: BigInt,
  distributionLimitCurrency: BigInt,
  overflowAllowance: BigInt,
  overflowAllowanceCurrency: BigInt,
  terminal: Bytes,
  token: Address,
  fundingCycleConfiguration: BigInt,
  fundingCycleNumber: BigInt | null = null
): void {
  const setFundAccessConstraintsEvent = new SetFundAccessConstraintsEvent(
    idForProjectTx(projectId, pv, event)
  );

  setFundAccessConstraintsEvent.caller = caller;
  setFundAccessConstraintsEvent.from = event.transaction.from;
  setFundAccessConstraintsEvent.distributionLimit = distributionLimit;
  setFundAccessConstraintsEvent.distributionLimitCurrency = distributionLimitCurrency.toI32();
  setFundAccessConstraintsEvent.overflowAllowance = overflowAllowance;
  setFundAccessConstraintsEvent.overflowAllowanceCurrency = overflowAllowanceCurrency.toI32();
  setFundAccessConstraintsEvent.terminal = terminal;
  setFundAccessConstraintsEvent.timestamp = event.block.timestamp.toI32();
  setFundAccessConstraintsEvent.token = token;
  setFundAccessConstraintsEvent.txHash = event.transaction.hash;
  setFundAccessConstraintsEvent.project = idForProject(projectId, pv);
  setFundAccessConstraintsEvent.fundingCycleConfiguration = fundingCycleConfiguration;
  setFundAccessConstraintsEvent.projectId = projectId.toI32();
  if (fundingCycleNumber) {
    setFundAccessConstraintsEvent.fundingCycleNumber = fundingCycleNumber.toI32();
  }
  setFundAccessConstraintsEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    setFundAccessConstraintsEvent.id,
    pv,
    ProjectEventKey.setFundAccessConstraintsEvent
  );
}
