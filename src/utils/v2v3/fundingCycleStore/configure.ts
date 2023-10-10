import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { ProjectEventKey, PV } from "../../../enums";
import { newPV2ConfigureEvent } from "../../entities/configureEvent";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import {
  extrapolateLatestFC,
  newFundingCycle,
} from "../../entities/fundingCycle";
import { Project } from "../../../../generated/schema";
import { idForProject } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Configure(
  event: ethereum.Event,
  projectId: BigInt,
  duration: BigInt,
  weight: BigInt,
  fcWeight: BigInt, // actual weight of the funding cycle, not weight emitted from event which may be different
  discountRate: BigInt,
  ballot: Address,
  mustStartAtOrAfter: BigInt,
  startTimestamp: BigInt,
  configuration: BigInt,
  metadata: BigInt,
  number: BigInt,
  basedOn: BigInt,
  caller: Address
): void {
  const configureEvent = newPV2ConfigureEvent(
    event,
    projectId,
    duration,
    weight,
    discountRate,
    ballot,
    mustStartAtOrAfter,
    configuration,
    caller
  );
  configureEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    configureEvent.id,
    pv,
    ProjectEventKey.configureEvent
  );

  extrapolateLatestFC(projectId, event.block.timestamp);

  const fc = newFundingCycle(
    projectId,
    number,
    basedOn,
    metadata,
    startTimestamp,
    duration,
    fcWeight,
    discountRate,
    ballot,
    configuration,
    mustStartAtOrAfter
  );
  fc.configureEvent = configureEvent.id;
  fc.save();

  const project = Project.load(idForProject(projectId, pv));
  if (project) {
    project.latestFundingCycle = number.toI32();
    project.save();
  }
}
