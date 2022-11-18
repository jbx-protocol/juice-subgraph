import { BigInt, log } from "@graphprotocol/graph-ts";

import {
  Project,
  ProjectCreateEvent,
  ProtocolLog,
  ProtocolV2Log,
} from "../../../generated/schema";
import {
  Create,
  SetMetadata,
  Transfer,
} from "../../../generated/V2JBProjects/JBProjects";
import { PROTOCOL_ID } from "../../constants";
import { ProjectEventKey, Version } from "../../types";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import {
  newProtocolLog,
  newProtocolV2Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import { idForProject, idForProjectTx } from "../../utils/ids";

const pv: Version = "2";

export function handleCreate(event: Create): void {
  const projectId = idForProject(event.params.projectId, pv);
  const project = new Project(projectId);
  if (!project) {
    log.error("[handleCreate] Missing project. ID:{}", [
      idForProject(event.params.projectId, pv),
    ]);
    return;
  }
  project.projectId = event.params.projectId.toI32();
  project.pv = pv;
  project.trendingScore = BigInt.fromString("0");
  project.trendingVolume = BigInt.fromString("0");
  project.trendingPaymentsCount = BigInt.fromString("0").toI32();
  project.createdWithinTrendingWindow = true;
  project.owner = event.params.owner;
  project.deployer = event.transaction.from;
  project.createdAt = event.block.timestamp.toI32();
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.totalPaid = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
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

  let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (!protocolV2Log) {
    /**
     * We only need to create the ProtocolV2Log once since there will only
     * ever be one entity. We might as well do it here when the first
     * project is created.
     */
    protocolV2Log = newProtocolV2Log();
  }
  if (protocolV2Log) {
    protocolV2Log.projectsCount = protocolV2Log.projectsCount + 1;
    protocolV2Log.log = PROTOCOL_ID;
    protocolV2Log.save();
  }
  updateProtocolEntity();
}

export function handleSetMetadata(event: SetMetadata): void {
  const project = Project.load(idForProject(event.params.projectId, pv));
  if (!project) {
    log.error("[handleSetMetadata] Missing project. ID:{}", [
      idForProject(event.params.projectId, pv),
    ]);
    return;
  }
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.save();
}

export function handleTransferOwnership(event: Transfer): void {
  const project = Project.load(idForProject(event.params.tokenId, pv));
  if (!project) {
    /**
     * Project will be missing when project 721 token is transferred
     * for the first time at creation, so we don't throw any errors.
     */
    return;
  }
  project.owner = event.params.to;
  project.save();
}
