import { BigInt, ethereum } from "@graphprotocol/graph-ts";

import { InitEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Init(
  event: ethereum.Event,
  projectId: BigInt,
  configuration: BigInt,
  basedOn: BigInt
): void {
  const initEvent = new InitEvent(idForProjectTx(projectId, pv, event));

  initEvent.projectId = projectId.toI32();
  initEvent.project = idForProject(projectId, pv);
  initEvent.timestamp = event.block.timestamp.toI32();
  initEvent.txHash = event.transaction.hash;
  initEvent.from = event.transaction.from;
  initEvent.configuration = configuration.toI32();
  initEvent.basedOn = basedOn.toI32();
  initEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    initEvent.id,
    pv,
    ProjectEventKey.initEvent,
  );
}
