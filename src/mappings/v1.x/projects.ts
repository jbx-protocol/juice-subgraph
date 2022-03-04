import { BigInt } from "@graphprotocol/graph-ts";

import {
  Create,
  SetHandle,
  SetUri,
} from "../../../generated/Projects/Projects";
import { Project } from "../../../generated/schema";
import { idForProject } from "../../utils";

export function handleProjectCreate(event: Create): void {
  let project = new Project(idForProject(event.params.projectId, 1));
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.cv = 1;
  project.terminal = event.params.terminal;
  project.handle = event.params.handle.toString();
  project.creator = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.uri;
  project.totalPaid = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.save();
}

export function handleSetHandle(event: SetHandle): void {
  let projectId = idForProject(event.params.projectId, 1);
  let project = Project.load(projectId);
  if (!project) return;
  project.handle = event.params.handle.toString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  let projectId = idForProject(event.params.projectId, 1);
  let project = Project.load(projectId);
  if (!project) return;
  project.metadataUri = event.params.uri;
  project.save();
}
