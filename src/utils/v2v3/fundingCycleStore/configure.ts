import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { ConfigureDataStruct } from "../../../../generated/V3JBFundingCycleStore/JBFundingCycleStore";
import { ProjectEventKey, PV } from "../../../enums";
import { newPV2ConfigureEvent } from "../../entities/configureEvent";
import { saveNewProjectEvent } from "../../entities/projectEvent";

const pv = PV.PV2;

export function handleV2V3Configure(
  event: ethereum.Event,
  projectId: BigInt,
  data: ConfigureDataStruct,
  mustStartAtOrAfter: BigInt,
  configuration: BigInt,
  metadata: BigInt,
  caller: Address
): void {
  const configureEvent = newPV2ConfigureEvent(
    event,
    projectId,
    data.duration,
    data.weight,
    data.discountRate,
    data.ballot,
    mustStartAtOrAfter,
    configuration,
    metadata
  );
  configureEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    configureEvent.id,
    pv,
    ProjectEventKey.configureEvent,
    caller
  );
}
