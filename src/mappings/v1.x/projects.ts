import { log } from "@graphprotocol/graph-ts";

import {
  Create,
  SetHandle,
  SetUri,
  Transfer,
} from "../../../generated/Projects/Projects";
import { Project } from "../../../generated/schema";
import { PV } from "../../enums";
import { idForProject } from "../../utils/ids";
import { handleProjectCreate } from "../../utils/projects/projectCreate";

const pv = PV.PV1;

export function handleCreate(event: Create): void {
  handleProjectCreate(
    event,
    event.params.projectId,
    pv,
    event.params.owner,
    event.params.caller,
    event.params.uri,
    null
  );
}

export function handleSetHandle(event: SetHandle): void {
  const idOfProject = idForProject(event.params.projectId, pv);
  const project = Project.load(idOfProject);
  if (!project) {
    log.error("[handleSetHandle] Missing project. ID:{}", [idOfProject]);
    return;
  }
  project.handle = event.params.handle.toString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  const idOfProject = idForProject(event.params.projectId, pv);
  const project = Project.load(idOfProject);
  if (!project) {
    log.error("[handleSetUri] Missing project. ID:{}", [idOfProject]);
    return;
  }
  project.metadataUri = event.params.uri;
  project.save();
}

export function handleTransferOwnership(event: Transfer): void {
  const idOfProject = idForProject(event.params.tokenId, pv);
  const project = Project.load(idOfProject);
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
