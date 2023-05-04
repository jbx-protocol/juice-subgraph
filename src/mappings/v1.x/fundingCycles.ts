import { BigInt } from "@graphprotocol/graph-ts";

import {
  Configure,
  Init,
} from "../../../generated/FundingCycles/FundingCycles";
import { V1ConfigureEvent, V1InitEvent } from "../../../generated/schema";
import { BIGINT_1, BITS_8 } from "../../constants";
import { ProjectEventKey, PV } from "../../enums";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import { bytes20FromUint } from "../../utils/format";
import { idForProject, idForProjectTx } from "../../utils/ids";

const pv = PV.PV1;

export function handleV1Configure(event: Configure): void {
  const projectId = idForProject(event.params.projectId, pv);
  const configureEvent = new V1ConfigureEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );

  configureEvent.projectId = event.params.projectId.toI32();
  configureEvent.project = projectId;
  configureEvent.from = event.transaction.from;
  configureEvent.caller = event.params.caller;
  configureEvent.txHash = event.transaction.hash;
  configureEvent.timestamp = event.block.timestamp.toI32();

  // From the cycle's FundingCycleProperties
  configureEvent.target = event.params._properties.target;
  configureEvent.currency = event.params._properties.currency.toI32();
  configureEvent.duration = event.params._properties.duration.toI32();
  configureEvent.cycleLimit = event.params._properties.cycleLimit.toI32();
  configureEvent.discountRate = event.params._properties.discountRate.toI32();
  configureEvent.ballot = event.params._properties.ballot;

  const metadata = event.params.metadata;

  // Top level
  configureEvent.fundingCycleId = event.params.fundingCycleId.toI32();
  configureEvent.reconfigured = event.params.reconfigured.toI32();
  configureEvent.metadata = metadata;

  // Unpacking metadata
  configureEvent.version = metadata.bitAnd(BigInt.fromI32(BITS_8)).toI32();
  configureEvent.reservedRate = metadata
    .rightShift(8)
    .bitAnd(BigInt.fromI32(BITS_8))
    .toI32();
  configureEvent.bondingCurveRate = metadata
    .rightShift(16)
    .bitAnd(BigInt.fromI32(BITS_8))
    .toI32();
  configureEvent.reconfigurationBondingCurveRate = metadata
    .rightShift(24)
    .bitAnd(BigInt.fromI32(BITS_8))
    .toI32();

  // If v1.1, parse additional metadata
  if (configureEvent.version > 0) {
    configureEvent.payIsPaused = !!metadata
      .rightShift(32)
      .bitAnd(BIGINT_1)
      .toI32();
    configureEvent.ticketPrintingIsAllowed = !!metadata
      .rightShift(33)
      .bitAnd(BIGINT_1)
      .toI32();

    configureEvent.extension = bytes20FromUint(metadata.rightShift(34));
  }

  configureEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    configureEvent.id,
    pv,
    ProjectEventKey.v1ConfigureEvent
  );
}

export function handleV1Init(event: Init): void {
  const projectId = idForProject(event.params.projectId, pv);
  const initEvent = new V1InitEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );

  initEvent.projectId = event.params.projectId.toI32();
  initEvent.project = projectId;
  initEvent.from = event.transaction.from;
  initEvent.txHash = event.transaction.hash;
  initEvent.timestamp = event.block.timestamp.toI32();

  initEvent.fundingCycleId = event.params.fundingCycleId.toI32();
  initEvent.previous = event.params.previous.toI32();
  initEvent.start = event.params.start.toI32();
  initEvent.weight = event.params.weight;
  initEvent.number = event.params.number.toI32();
  initEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    initEvent.id,
    pv,
    ProjectEventKey.v1InitEvent
  );
}
