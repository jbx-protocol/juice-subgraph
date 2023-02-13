import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { JBProjectHandles } from "../../../generated/JBProjectHandles/JBProjectHandles";
import { Project } from "../../../generated/schema";
import {
  address_shared_jbProjectHandles,
  address_shared_legacy_jbProjectHandles,
} from "../../contractAddresses";
import { startBlock_shared_jbProjectHandles } from "../../startBlocks";
import { PV } from "../../enums";
import { idForProject } from "../ids";

export function updateProjectHandle(
  projectId: BigInt,
  blockNumber: BigInt
): void {
  if (!address_shared_jbProjectHandles) return;

  // If there is a legacy jbProjectHandles address and the block height is prior to the jbProjectHandles startBlock, use the legacy address
  const projectHandlesAddress =
    address_shared_legacy_jbProjectHandles &&
    startBlock_shared_jbProjectHandles &&
    blockNumber.toI32() < startBlock_shared_jbProjectHandles
      ? address_shared_legacy_jbProjectHandles
      : address_shared_jbProjectHandles;

  const jbProjectHandles = JBProjectHandles.bind(
    Address.fromString(projectHandlesAddress!)
  );
  const handleCallResult = jbProjectHandles.try_handleOf(projectId);
  const pv = PV.PV2;
  const project = Project.load(idForProject(projectId, pv));
  if (!project) {
    log.error("[handleSetReverseRecord] Missing project. ID:{}", [
      projectId.toString(),
    ]);
    return;
  }

  if (handleCallResult.reverted) {
    project.handle = null;
  } else {
    project.handle = handleCallResult.value;
  }

  project.save();
}
