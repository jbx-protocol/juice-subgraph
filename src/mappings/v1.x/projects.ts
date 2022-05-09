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
import { ProjectEventKey } from "../../types";
import {
  cvForTerminal,
  cvForV1Project,
  idForProject,
  idForProjectTx,
  protocolId,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils";

export function handleProjectCreate(event: Create): void {
  let cv = cvForTerminal(event.params.terminal);

  let projectId = idForProject(event.params.projectId, cv);

  let project = new Project(projectId);
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.projectId = event.params.projectId.toI32();
  project.cv = cv;
  project.terminal = event.params.terminal;
  project.handle = event.params.handle.toString();
  project.owner = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.uri;
  project.totalPaid = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.save();

  let projectCreateEvent = new ProjectCreateEvent(
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

  if (!ProtocolLog.load(protocolId)) new ProtocolLog(protocolId).save();

  let protocolLog = ProtocolV1Log.load(protocolId);
  if (!protocolLog) protocolLog = new ProtocolV1Log(protocolId);
  // We only need to create log here, since there will only be one entity and it will be created when first project is created.
  protocolLog.projectsCount = protocolLog.projectsCount + 1;
  protocolLog.log = protocolId;
  protocolLog.save();

  updateProtocolEntity();
}

export function handleSetHandle(event: SetHandle): void {
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  project.handle = event.params.handle.toString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  project.metadataUri = event.params.uri;
  project.save();
}

export function handleTransferOwnership(event: Transfer): void {
  let cv = cvForV1Project(event.params.tokenId);
  let project = Project.load(idForProject(event.params.tokenId, cv));
  if (!project) return;
  project.owner = event.params.to;
  project.save();
}
