import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { MigrateEvent, Project } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForMigrateEvent, idForProject } from "../../ids";

const pv = PV.PV2;

export function handleV2V3TerminalMigrate(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  caller: Bytes,
  to: Bytes
): void {
  const project = Project.load(idForProject(projectId, pv));

  if (!project) return;

  // Migrating terminals will emit an AddToBalance event prior to the Migrate event, incorrectly increasing the project's balance. We reverse the balance increase here.
  project.currentBalance = project.currentBalance.minus(amount);
  project.save();

  const migrateEvent = new MigrateEvent(
    idForMigrateEvent(projectId, pv, event.block.number)
  );
  migrateEvent.amount = amount;
  migrateEvent.caller = caller;
  migrateEvent.from = event.transaction.from;
  migrateEvent.project = project.id;
  migrateEvent.projectId = projectId.toI32();
  migrateEvent.to = to;
  migrateEvent.txHash = event.transaction.hash;
  migrateEvent.timestamp = event.block.timestamp.toI32();
  migrateEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    migrateEvent.id,
    pv,
    ProjectEventKey.migrate
  );
}
