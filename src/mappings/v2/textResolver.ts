import { Address, BigInt, ens, log, store } from "@graphprotocol/graph-ts";

import { ENSNode } from "../../../generated/schema";
import {
  TextChanged,
  TextResolver,
} from "../../../generated/TextResolver/TextResolver";
import { address_textResolver } from "../../contractAddresses";
import { isNumberString, updateV2ProjectHandle } from "../../utils";

const key = "juicebox";

export function handleTextChanged(event: TextChanged): void {
  if (event.params.key != key) return;

  log.warning("AAA Handling text changed, node: {}, key: {}", [
    event.params.node.toHexString(),
    event.params.key,
  ]);

  // Get value of text record
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
  let projectId: BigInt;
  if (isNumberString(textCallResult.value)) {
    projectId = BigInt.fromString(textCallResult.value);
    updateV2ProjectHandle(projectId);
  }

  let ensNodeId = event.params.node.toHexString();
  let ensNode = ENSNode.load(ensNodeId);
  // If this ens node has already been mapped to a Project, update handle for previously mapped Project
  if (ensNode) {
    updateV2ProjectHandle(BigInt.fromI32(ensNode.projectId));
    log.warning("AAA ensNode found, {}", [ensNodeId]);
  } else {
    ensNode = new ENSNode(ensNodeId);
    log.warning("AAA Created ensNode, {}", [ensNodeId]);
  }

  ensNode.projectId = projectId ? projectId.toI32() : null;
  ensNode.save();
  log.warning("AAA Saved ensNode, {}", [ensNodeId]);
}
