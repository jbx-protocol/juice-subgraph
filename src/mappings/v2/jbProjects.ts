import { BigInt } from "@graphprotocol/graph-ts";

import { Create, SetMetadata } from "../../../generated/JBProjects/JBProjects";
import {
  Project,
  ProjectCreateEvent,
  ProjectEvent,
  ProtocolV2Log,
} from "../../../generated/schema";
import { CV } from "../../types";
import {
  idForProject,
  idForProjectEvent,
  protocolId,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = 2;

export function handleCreate(event: Create): void {
  let projectId = idForProject(event.params.projectId, cv);

  let project = new Project(projectId);
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.cv = cv;
  project.creator = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
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

  let log = ProtocolV2Log.load(protocolId);
  if (!log) log = new ProtocolV2Log(protocolId);
  // We only need to create log here, since there will only be one entity and it will be created when first project is created.
  log.projectsCount = log.projectsCount + 1;
  log.log = protocolId;
  log.save();
  updateProtocolEntity();
}

export function handleSetMetadata(event: SetMetadata): void {
  let project = Project.load(idForProject(event.params.projectId, cv));
  if (!project) return;
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.save();
}
