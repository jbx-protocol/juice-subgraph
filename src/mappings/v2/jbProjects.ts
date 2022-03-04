import { BigInt } from "@graphprotocol/graph-ts";

import { Create } from "../../../generated/JBProjects/JBProjects";
import { Project } from "../../../generated/schema";
import { idForProject } from "../../utils";

export function handleCreate(event: Create): void {
  let project = new Project(idForProject(event.params.projectId, 2));
  if (!project) return;
  project.projectId = event.params.projectId.toI32();
  project.cv = 2;
  project.creator = event.params.owner;
  project.createdAt = event.block.timestamp;
  project.metadataUri = event.params.metadata.content;
  project.metadataDomain = event.params.metadata.domain;
  project.totalPaid = BigInt.fromString("0");
  project.totalRedeemed = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.save();
}
