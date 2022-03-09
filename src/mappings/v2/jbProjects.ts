import { BigInt } from "@graphprotocol/graph-ts";

import { Create, SetMetadata } from "../../../generated/JBProjects/JBProjects";
import { Project } from "../../../generated/schema";
import { CV } from "../../types";
import { idForProject } from "../../utils";

const CV: CV = 2;

export function handleCreate(event: Create): void {
  let project = new Project(idForProject(event.params.projectId, CV));
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.cv = CV;
  project.creator = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.totalPaid = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.save();
}

export function handleSetMetadata(event: SetMetadata): void {
  let project = Project.load(idForProject(event.params.projectId, CV));
  if (!project) return;
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.save();
}
