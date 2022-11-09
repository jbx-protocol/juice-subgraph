import { Bytes } from "@graphprotocol/graph-ts";

import {
  Configure,
  Init,
} from "../../../generated/FundingCycles/FundingCycles";
import { V1ConfigureEvent, V1InitEvent } from "../../../generated/schema";
import { BITS_8 } from "../../constants";
import { ProjectEventKey } from "../../types";
import { saveNewProjectEvent } from "../../utils/entity";
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

  // Top level
  configureEvent.fundingCycleId = event.params.fundingCycleId.toI32();
  configureEvent.reconfigured = event.params.reconfigured.toI32();
  configureEvent.metadata = event.params.metadata;

  // Unpacking metadata
  configureEvent.version = event.params.metadata.toI32() & BITS_8;
  configureEvent.reservedRate = (event.params.metadata.toI32() >> 8) & BITS_8;
  configureEvent.bondingCurveRate =
    (event.params.metadata.toI32() >> 16) & BITS_8;
  configureEvent.reconfigurationBondingCurveRate =
    (event.params.metadata.toI32() >> 24) & BITS_8;

  // If v1.1, parse additional metadata
  if (configureEvent.version) {
    configureEvent.payIsPaused = !!((event.params.metadata.toI32() >> 32) & 1);
    configureEvent.ticketPrintingIsAllowed = !!(
      (event.params.metadata.toI32() >> 33) &
      1
    );

    let extension = Bytes.fromHexString("0x");
    for (let i = 34; i < 160; i += 32) {
      extension = extension.concatI32(event.params.metadata.toI32() >> i);
    }
    configureEvent.extension = extension;
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
