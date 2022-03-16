import { BigInt } from "@graphprotocol/graph-ts";

import {
  Create,
  SetHandle,
  SetUri,
} from "../../../generated/Projects/Projects";
import {
  Project,
  ProjectCreateEvent,
  ProjectEvent,
  ProtocolLog,
  ProtocolV1Log,
} from "../../../generated/schema";
import { CV } from "../../types";
import {
  idForProject,
  idForProjectEvent,
  protocolId,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = 1;

export function handleProjectCreate(event: Create): void {
  let projectId = idForProject(event.params.projectId, cv);

  let project = new Project(projectId);
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.cv = cv;
  project.terminal = event.params.terminal;
  project.handle = event.params.handle.toString();
  project.creator = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.uri;
  project.totalPaid = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.save();

  let projectCreateEvent = new ProjectCreateEvent(projectId);
  projectCreateEvent.cv = cv;
  projectCreateEvent.projectId = event.params.projectId.toI32();
  projectCreateEvent.timestamp = event.block.timestamp;
  projectCreateEvent.txHash = event.transaction.hash;
  projectCreateEvent.caller = event.params.caller;
  projectCreateEvent.save();

  let projectEvent = new ProjectEvent(
    idForProjectEvent(
      event.params.projectId,
      cv,
      event.transaction.hash,
      event.transactionLogIndex
    )
  );
  projectEvent.cv = cv;
  projectEvent.projectId = event.params.projectId.toI32();
  projectEvent.timestamp = event.block.timestamp;
  projectEvent.projectCreateEvent = projectCreateEvent.id;
  projectEvent.project = projectId;
  projectEvent.save();

  if (!ProtocolLog.load(protocolId)) new ProtocolLog(protocolId).save();

  let v1Log = ProtocolV1Log.load(protocolId);
  if (!v1Log) v1Log = new ProtocolV1Log(protocolId);
  // We only need to create log here, since there will only be one entity and it will be created when first project is created.
  v1Log.projectsCount = v1Log.projectsCount + 1;
  v1Log.log = protocolId;
  v1Log.save();

  updateProtocolEntity();
}

export function handleSetHandle(event: SetHandle): void {
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  project.handle = event.params.handle.toString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  project.metadataUri = event.params.uri;
  project.save();
}