import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { ConfigureEvent } from "../../../generated/schema";
import { PV } from "../../enums";
import { idForConfigureEvent, idForProject } from "../ids";

export function newPV2ConfigureEvent(
  // Note: Can't use an object arg here because assemblyscript
  // We could pass the configure event itself as an arg, but we could only type it as a V2 *OR* V3 JBFundingCycleStore.configure event.
  event: ethereum.Event,
  projectId: BigInt,
  duration: BigInt,
  weight: BigInt,
  discountRate: BigInt,
  ballot: Bytes,
  mustStartAtOrAfter: BigInt,
  configuration: BigInt,
  // metadata: BigInt,
  caller: Bytes,
  memo: string | null = null
): ConfigureEvent {
  const pv = PV.PV2;

  const configureEvent = new ConfigureEvent(
    idForConfigureEvent(projectId, pv, event)
  );

  configureEvent.projectId = projectId.toI32();
  configureEvent.project = idForProject(projectId, pv);
  configureEvent.timestamp = event.block.timestamp.toI32();
  configureEvent.txHash = event.transaction.hash;
  configureEvent.caller = caller;
  configureEvent.from = event.transaction.from;

  // From the cycle's JBFundingCycleData
  configureEvent.duration = duration.toI32();
  configureEvent.weight = weight;
  configureEvent.discountRate = discountRate;
  configureEvent.ballot = ballot;
  configureEvent.memo = memo;

  // Top level
  configureEvent.mustStartAtOrAfter = mustStartAtOrAfter.toI32();
  configureEvent.configuration = configuration;

  return configureEvent;
}
