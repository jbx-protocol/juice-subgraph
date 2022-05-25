import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { JBProjectHandles } from "../../../generated/JBProjectHandles/JBProjectHandles";
import { Project } from "../../../generated/schema";
import {
  TextChanged,
  TextResolver,
} from "../../../generated/TextResolver/TextResolver";
import {
  address_jbProjectHandles,
  address_textResolver,
} from "../../contractAddresses";
import { CV } from "../../types";
import { idForProject } from "../../utils";

const cv: CV = "2";

const key = "juicebox";

export function handleTextChanged(event: TextChanged): void {
  log.info("Handling text record changed, {}", [event.params.key]);
  if (event.params.key !== key) return;

  // Get projectId value of text record
  let textResolver = TextResolver.bind(
    Address.fromString(address_textResolver)
  );
  let textCallResult = textResolver.try_text(event.params.node, key);
  if (textCallResult.reverted) {
    log.error("TextResolver.text reverted, node: {}, textResolver: {}", [
      event.params.node.toHexString(),
      address_textResolver,
    ]);
    return;
  }

  // Get project handle
  let projectBigInt = BigInt.fromString(textCallResult.value);
  let jbProjectHandles = JBProjectHandles.bind(
    Address.fromString(address_jbProjectHandles)
  );
  let handleCallResult = jbProjectHandles.try_handleOf(projectBigInt);
  if (handleCallResult.reverted) {
    log.error(
      "JBProjectHandles.handleOf reverted, projectId: {}, jbProjectHandles: {}",
      [projectBigInt.toString(), address_jbProjectHandles]
    );
    return;
  }

  // Update project entity
  let projectId = idForProject(projectBigInt, cv);
  let project = Project.load(projectId);
  if (!project) {
    log.error("[handleTextChanged] Missing project. ID:{}", [projectId]);
    return;
  }
  project.handle = handleCallResult.value.toString();
  project.save();
}
