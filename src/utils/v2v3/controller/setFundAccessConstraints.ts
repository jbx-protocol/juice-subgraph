import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { SetFundAccessConstraintsEvent } from "../../../../generated/schema";
import { SetFundAccessConstraintsConstraintsStruct } from "../../../../generated/V3JBController/JBController";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3SetFundAccessConstraints(
  event: ethereum.Event,
  projectId: BigInt,
  caller: Address,
  constraints: SetFundAccessConstraintsConstraintsStruct,
  fundingCycleConfiguration: BigInt,
  fundingCycleNumber: BigInt
): void {
  const setFundAccessConstraintsEvent = new SetFundAccessConstraintsEvent(
    idForProjectTx(projectId, pv, event)
  );

  setFundAccessConstraintsEvent.caller = caller;
  setFundAccessConstraintsEvent.distributionLimit =
    constraints.distributionLimit;
  setFundAccessConstraintsEvent.distributionLimitCurrency =
    constraints.distributionLimitCurrency;
  setFundAccessConstraintsEvent.overflowAllowance =
    constraints.overflowAllowance;
  setFundAccessConstraintsEvent.overflowAllowanceCurrency =
    constraints.overflowAllowanceCurrency;
  setFundAccessConstraintsEvent.terminal = constraints.terminal;
  setFundAccessConstraintsEvent.token = constraints.token;
  setFundAccessConstraintsEvent.fundingCycleConfiguration = fundingCycleConfiguration;
  setFundAccessConstraintsEvent.fundingCycleNumber = fundingCycleNumber;
  setFundAccessConstraintsEvent.projectId = projectId;
  setFundAccessConstraintsEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    setFundAccessConstraintsEvent.id,
    pv,
    ProjectEventKey.setFundAccessConstraintsEvent,
    caller
  );
}
