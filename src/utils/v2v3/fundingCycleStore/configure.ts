import { Address, BigInt, ethereum, store } from "@graphprotocol/graph-ts";

import { ProjectEventKey, PV } from "../../../enums";
import { newPV2ConfigureEvent } from "../../entities/configureEvent";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { newFundingCycle } from "../../entities/fundingCycle";
import { Project } from "../../../../generated/schema";
import { idForFundingCycle, idForProject } from "../../ids";
import { BIGINT_0, BIGINT_1 } from "../../../constants";

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

  if (number.gt(BIGINT_1)) {
    // Interpolate all previous funding cycles, beginning with `number` and iterating downward
    for (
      let i = number.minus(BIGINT_1);
      i.gt(BIGINT_0);
      i = i.minus(BIGINT_1)
    ) {
      if (store.get("FundingCycle", idForFundingCycle(projectId, i))) {
        // break once stored fc with matching number is found
        break;
      }

      newFundingCycle(
        projectId,
        i,
        basedOn, // Interpolated fcs should all have the same basedOn
        metadata,
        startTimestamp.minus(number.minus(i).times(duration)),
        duration,
        weight,
        discountRate,
        ballot,
        configuration
      ).save();
    }
  }

  const project = Project.load(idForProject(projectId, pv));
  if (project) {
    project.latestFundingCycle = number.toI32();
    project.save();
  }
}
