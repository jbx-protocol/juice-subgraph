import { BigInt } from "@graphprotocol/graph-ts";

import { Create, SetHandle, SetUri } from "../../generated/Projects/Projects";
import { Project } from "../../generated/schema";

export function handleProjectCreate(event: Create): void {
  let project = new Project(event.params.projectId.toString());
  if (!project) return;
  project.handle = event.params.handle.toHexString();
  project.creator = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.uri = event.params.uri;
  project.totalPaid = new BigInt(0);
  project.totalRedeemed = new BigInt(0);
  project.currentBalance = new BigInt(0);
  project.save();
}

export function handleSetHandle(event: SetHandle): void {
  let project = Project.load(event.params.projectId.toString());
  if (!project) return;
  project.handle = event.params.handle.toHexString();
  project.save();
}

export function handleSetUri(event: SetUri): void {
  let project = Project.load(event.params.projectId.toString());
  if (!project) return;
  project.uri = event.params.uri;
  project.save();
}
