import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import {
  Create,
  SetMetadata,
  Transfer,
} from "../../../generated/JBProjects/JBProjects";
import {
  Project,
  ProjectCreateEvent,
  ProtocolV2Log,
} from "../../../generated/schema";
import { CV, ProjectEventKey } from "../../types";
import {
  idForProject,
  idForProjectTx,
  protocolId,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = "2";

export function handleCreate(event: Create): void {
  let projectId = idForProject(event.params.projectId, cv);

  let project = new Project(projectId);
  if (!project) {
    log.error("[handleCreate] Missing project. ID:{}", [
      idForProject(event.params.projectId, cv),
    ]);
    return;
  }
  project.projectId = event.params.projectId.toI32();
  project.cv = cv;
  project.owner = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
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

  let protocolLog = ProtocolV2Log.load(protocolId);
  if (!protocolLog) protocolLog = new ProtocolV2Log(protocolId);
  // We only need to create log here, since there will only be one entity and it will be created when first project is created.
  protocolLog.projectsCount = protocolLog.projectsCount + 1;
  protocolLog.log = protocolId;
  protocolLog.save();
  updateProtocolEntity();
}

export function handleSetMetadata(event: SetMetadata): void {
  let project = Project.load(idForProject(event.params.projectId, cv));
  if (!project) {
    log.error("[handleSetMetadata] Missing project. ID:{}", [
      idForProject(event.params.projectId, cv),
    ]);
    return;
  }
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.save();
}

export function handleTransferOwnership(event: Transfer): void {
  let project = Project.load(idForProject(event.params.tokenId, cv));
  if (!project) {
    // Project will be missing on initial mint transfer
    return;
  }
  project.owner = event.params.to;
  project.save();
}
