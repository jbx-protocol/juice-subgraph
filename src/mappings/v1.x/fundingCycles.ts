import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Configure
  Init
} from "../../../generated/FundingCycles/FundingCycles"
import {
  V1ConfigureEvent,
  V1InitEvent,
} from "../../../generated/schema"
import { ProjectEventKey } from "../../types";
import { pvForV1Project } from "../../utils/pv";
import { saveNewProjectEvent } from "../../utils/entity";
import { idForProject, idForProjectTx } from "../../utils/ids";

export function handleV1Configure(event: Configure): void {
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const configureEvent = new V1ConfigureEvent(idForProjectTx(event.params.projectId, pv, event));
  const BigIntOne = BigInt.fromI32(1);

 if (!configureEvent) return;
  configureEvent.projectId = event.params.projectId.toI32();
  configureEvent.project = projectId;
  configureEvent.caller = event.transaction.from;
  configureEvent.txHash = even.transaction.hash;
  initEvent.timestamp = event.block.timestamp.toI32();

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
  configureEvent.version = u8(event.params.metadata.toI32());
  configureEvent.reservedRate = u8((event.params.metadata >> 8).toI32());
  configureEvent.bondingCurveRate = u8((event.params.metadata >> 16).toI32());
  configureEvent.reconfigurationBondingCurveRate = u8((event.params.metadata >> 24).toI32());

  // If v1.1, parse additional metadata
  if(configureEvent.version) {
    configureEvent.payIsPaused = bool(((event.params.metadata >> 32) & BigIntOne).toI32());
    configureEvent.ticketPrintingIsAllowed = bool(((event.params.metadata >> 33) & BigIntOne).toI32());

    let extension = Bytes.fromHexString('0x');
    for(let i=0; i<160; i+=32) {
      extension = extension.concatI32((event.params.metadata >> (34+i)).toI32());
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
  const initEvent = new V1InitEvent(idForProjectTx(event.params.projectId, pv, event));

  if (!initEvent) return;
  initEvent.projectId = event.params.projectId.toI32();
  initEvent.project = projectId;
  initEvent.caller = event.transaction.from;
  initEvent.txHash = even.transaction.hash;
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
