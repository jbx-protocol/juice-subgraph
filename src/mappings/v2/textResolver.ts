import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { V2ProjectHandleNode } from "../../../generated/schema";
import {
  TextChanged,
  TextResolver,
} from "../../../generated/TextResolver/TextResolver";
import { address_textResolver } from "../../contractAddresses";
import { updateV2ProjectHandle } from "../../utils";

const key = "juicebox";

export function handleTextChanged(event: TextChanged): void {
  log.warning("textchanged key, {}, {}", [
    event.params.key,
    event.params.indexedKey.toString(),
  ]);
  if (event.params.key !== key) return;

  log.warning("AAA Handling text changed, node: {}, key: {}", [
    event.params.node.toHexString(),
    event.params.key,
  ]);

  let projectHandleNodeId = event.params.node.toHexString();
  let projectHandleNode = V2ProjectHandleNode.load(projectHandleNodeId);
  if (projectHandleNode) {
    log.warning("AAA projectHandleNode found, {}", [projectHandleNodeId]);

    // If this ens node has already been mapped to a Project, update handle for previously mapped Project
    updateV2ProjectHandle(BigInt.fromI32(projectHandleNode.projectId));
  } else {
    log.warning("AAA Creating projectHandleNode, {}", [projectHandleNodeId]);

    projectHandleNode = new V2ProjectHandleNode(projectHandleNodeId);
  }

  // Get projectId value of text record
  let textResolver = TextResolver.bind(
    Address.fromString(address_textResolver)
  );
  let textCallResult = textResolver.try_text(event.params.node, key);
  if (textCallResult.reverted) {
    log.warning("TextResolver.text reverted, node: {}, textResolver: {}", [
      event.params.node.toHexString(),
      address_textResolver,
    ]);
    return;
  }
  let projectBigInt = BigInt.fromString(textCallResult.value);

  // Update projectId mapping for this ens node
  projectHandleNode.projectId = projectBigInt.toI32();
  projectHandleNode.save();
  log.warning("AAA Saved projectHandleNode, {}", [projectHandleNodeId]);

  updateV2ProjectHandle(projectBigInt);
}
