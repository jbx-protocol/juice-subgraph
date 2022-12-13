import { BigInt, log } from "@graphprotocol/graph-ts";

import {
  Create,
  SetHandle,
  SetUri,
  Transfer,
} from "../../../generated/Projects/Projects";
import {
  Project,
  ProjectCreateEvent,
  ProtocolLog,
  ProtocolV1Log,
} from "../../../generated/schema";
import { PROTOCOL_ID } from "../../constants";
import { ProjectEventKey } from "../../types";
import { pvForTerminal, pvForV1Project } from "../../utils/pv";
import { idForProject, idForProjectTx } from "../../utils/ids";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import {
  newProtocolLog,
  newProtocolV1Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";

export function handleProjectCreate(event: Create): void {
  const pv = pvForTerminal(event.params.terminal);
  const projectId = idForProject(event.params.projectId, pv);
  const project = new Project(projectId);

  if (!project) {
    log.error("[handleProjectCreate] Missing project. ID:{}", [projectId]);
    return;
  }

  project.projectId = event.params.projectId.toI32();
  project.pv = pv;
  project.trendingScore = BigInt.fromString("0");
  project.trendingVolume = BigInt.fromString("0");
  project.trendingPaymentsCount = BigInt.fromString("0").toI32();
  project.createdWithinTrendingWindow = true;
  project.terminal = event.params.terminal;
  project.handle = event.params.handle.toString();
  project.owner = event.params.owner;
  project.createdAt = event.block.timestamp.toI32();
  project.metadataUri = event.params.uri;
  project.totalPaid = BigInt.fromString("0");
  project.totalPaidUSD = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.totalRedeemedUSD = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.paymentsCount = 0;
  project.redeemCount = 0;
  project.save();

  const projectCreateEvent = new ProjectCreateEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );
  if (projectCreateEvent) {
    projectCreateEvent.pv = pv;
    projectCreateEvent.project = project.id;
    projectCreateEvent.projectId = event.params.projectId.toI32();
    projectCreateEvent.timestamp = event.block.timestamp.toI32();
    projectCreateEvent.txHash = event.transaction.hash;
    projectCreateEvent.caller = event.transaction.from;
    projectCreateEvent.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      projectCreateEvent.id,
      pv,
      ProjectEventKey.projectCreateEvent
    );
  }

  if (!ProtocolLog.load(PROTOCOL_ID)) {
    const protocolLog = newProtocolLog();
    protocolLog.save();
  }

  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = newProtocolV1Log();
  if (protocolV1Log) {
    protocolV1Log.projectsCount = protocolV1Log.projectsCount + 1;
    protocolV1Log.save();
  }

  updateProtocolEntity();
}

export function handleSetHandle(event: SetHandle): void {
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleProjectCreate] Missing project. ID:{}", [projectId]);
    return;
  }
  project.handle = event.params.handle.toString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleProjectCreate] Missing project. ID:{}", [projectId]);
    return;
  }
  project.metadataUri = event.params.uri;
  project.save();
}

export function handleTransferOwnership(event: Transfer): void {
  const pv = pvForV1Project(event.params.tokenId);
  const projectId = idForProject(event.params.tokenId, pv);
  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleProjectCreate] Missing project. ID:{}", [projectId]);
    return;
  }
  project.owner = event.params.to;
  project.save();
}
