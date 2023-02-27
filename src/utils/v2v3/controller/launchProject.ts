import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { Project } from "../../../../generated/schema";
import { PV } from "../../../enums";
import { idForProject } from "../../ids";

const pv = PV.PV2;

export function handleV2V3LaunchProject(
  projectId: BigInt,
  caller: Address
): void {
  const idOfProject = idForProject(projectId, pv);

  const project = Project.load(idOfProject);

  if (!project) {
    log.error("[handleV2V3LaunchProject] Missing project. ID: {}", [
      idOfProject,
    ]);
    return;
  }

  // If the controller emits a launchProject event, the project launch tx was called via the JBController, and we want to prefer its `caller` param over any existing value
  project.deployer = caller;

  project.save();
}
