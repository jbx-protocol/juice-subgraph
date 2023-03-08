import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { ConfigureEvent } from "../../../../generated/schema";
import { PV } from "../../../enums";
import { idForConfigureEvent } from "../../ids";

const pv = PV.PV2;

export function handleV2V3ReconfigureFundingCycles(
  event: ethereum.Event,
  projectId: BigInt,
  memo: string
): void {
  const configureEventId = idForConfigureEvent(projectId, pv, event);
  const configureEvent = ConfigureEvent.load(configureEventId);

  if (!configureEvent) {
    log.error(
      "[handleV2V3ReconfigureFundingCycles] Missing ConfigureEvent. ID: {}",
      [configureEventId]
    );
    return;
  }

  // The ConfigureEvent has already been created in JBFundingCycleStore. We just want to load it from the JBController event handler to attach the memo
  configureEvent.memo = memo;
  configureEvent.save();
}
