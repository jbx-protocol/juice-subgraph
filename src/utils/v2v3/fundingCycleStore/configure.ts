import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { ProjectEventKey, PV } from "../../../enums";
import { newPV2ConfigureEvent } from "../../entities/configureEvent";
import { saveNewProjectEvent } from "../../entities/projectEvent";

const pv = PV.PV2;

export function handleV2V3Configure(
  event: ethereum.Event,
  projectId: BigInt,
  duration: BigInt,
  weight: BigInt,
  discountRate: BigInt,
  ballot: Address,
  mustStartAtOrAfter: BigInt,
  configuration: BigInt,
  metadata: BigInt,
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
    metadata,
    caller
  );
  configureEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    configureEvent.id,
    pv,
    ProjectEventKey.configureEvent,
  );
}
