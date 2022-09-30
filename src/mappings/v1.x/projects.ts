import { BigInt } from "@graphprotocol/graph-ts";

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
import { cvForTerminal, cvForV1Project } from "../../utils/cv";
import {
  newProtocolLog,
  newProtocolV1Log,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils/entity";
import { idForProject, idForProjectTx } from "../../utils/ids";

export function handleProjectCreate(event: Create): void {
  const cv = cvForTerminal(event.params.terminal);
  const projectId = idForProject(event.params.projectId, cv);
  const project = new Project(projectId);
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.cv = cv;
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
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.save();

  const projectCreateEvent = new ProjectCreateEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (projectCreateEvent) {
    projectCreateEvent.cv = cv;
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
      cv,
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
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);
  if (!project) return;
  project.handle = event.params.handle.toString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);
  if (!project) return;
  project.metadataUri = event.params.uri;
  project.save();
}

export function handleTransferOwnership(event: Transfer): void {
  const cv = cvForV1Project(event.params.tokenId);
  const project = Project.load(idForProject(event.params.tokenId, cv));
  if (!project) return;
  project.owner = event.params.to;
  project.save();
}
