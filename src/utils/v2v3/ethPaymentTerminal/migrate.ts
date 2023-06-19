import { BigInt } from "@graphprotocol/graph-ts";

import { Project } from "../../../../generated/schema";
import { PV } from "../../../enums";
import { idForProject } from "../../ids";

const pv = PV.PV2;

export function handleV2V3TerminalMigrate(projectId: BigInt, amount: BigInt) {
  const id = idForProject(projectId, pv);
  const project = Project.load(id);
  if (!project) return;
  // The Migrate event triggers an AddToBalance event, which will incorrectly increase a project's balance. To negate the increase, we decrease the balance in the Migrate handler.
  project.currentBalance = project.currentBalance.minus(amount);
  project.save();
}
