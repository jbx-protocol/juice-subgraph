import { log } from "@graphprotocol/graph-ts";

import { Project } from "../../../generated/schema";
import {
  Create,
  SetMetadata,
  Transfer,
} from "../../../generated/JBProjects/JBProjects";
import { PV } from "../../enums";
import { idForProject } from "../../utils/ids";
import { handleProjectCreate } from "../../utils/projects/projectCreate";

const pv = PV.PV2;

export function handleCreate(event: Create): void {
  handleProjectCreate(
    event,
    event.params.projectId,
    pv,
    event.params.owner,
    event.params.caller,
    event.params.metadata.content,
    event.params.metadata.domain
  );
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
