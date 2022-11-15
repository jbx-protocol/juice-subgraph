import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  Configure,
  Init,
} from "../../../generated/FundingCycles/FundingCycles";
import { V1ConfigureEvent, V1InitEvent } from "../../../generated/schema";
import { BITS_8 } from "../../constants";
import { ProjectEventKey } from "../../types";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import { idForProject, idForProjectTx } from "../../utils/ids";
import { pvForV1Project } from "../../utils/pv";

export function handleV1Configure(event: Configure): void {
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const configureEvent = new V1ConfigureEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );

  configureEvent.projectId = event.params.projectId.toI32();
  configureEvent.project = projectId;
  configureEvent.caller = event.transaction.from;
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
  if (configureEvent.version) {
    configureEvent.payIsPaused = !!metadata
      .rightShift(32)
      .bitAnd(BigInt.fromI32(1))
      .toI32();
    configureEvent.ticketPrintingIsAllowed = !!metadata
      .rightShift(33)
      .bitAnd(BigInt.fromI32(1))
      .toI32();

    // let extension = Bytes.fromHexString("0x");
    // for (let i = 34; i < 160; i += 32) {
    //   extension = extension.concatI32(metadata.rightShift(i).toI32());
    // }
    // configureEvent.extension = Bytes.fromUint8Array(extension.reverse());
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
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const initEvent = new V1InitEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );

  if (!initEvent) return;
  initEvent.projectId = event.params.projectId.toI32();
  initEvent.project = projectId;
  initEvent.caller = event.transaction.from;
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
