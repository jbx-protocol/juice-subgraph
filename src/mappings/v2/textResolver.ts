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

  let projectHandleNode = V2ProjectHandleNode.load(
    event.params.node.toHexString()
  );
  if (projectHandleNode) {
    // If this ens node has already been mapped to a Project, update handle for previously mapped Project
    updateV2ProjectHandle(BigInt.fromI32(projectHandleNode.projectId));
  } else {
    projectHandleNode = new V2ProjectHandleNode(
      event.params.node.toHexString()
    );
  }
  // Store a mapping from this ens node to Project with matching projectId
  let projectBigInt = BigInt.fromString(textCallResult.value);
  projectHandleNode.projectId = projectBigInt.toI32();
  projectHandleNode.save();

  updateV2ProjectHandle(projectBigInt);
}
