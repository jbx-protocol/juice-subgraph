import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { ENSNode } from "../../../generated/schema";
import {
  TextChanged,
  TextResolver,
} from "../../../generated/TextResolver/TextResolver";
import { address_textResolver } from "../../contractAddresses";
import { isNumberString, updateV2ProjectHandle } from "../../utils";

// Note: DRYest method would be to read TEXT_KEY from the JBProjectHandles contract. But that would require making a contract call on every TextChanged event... which is a lot of events. So we just hard code it.
const TEXT_KEY = "juicebox_project_id";

export function handleTextChanged(event: TextChanged): void {
  if (event.params.key != TEXT_KEY) return;

  // Get value of text record
  let textResolver = TextResolver.bind(
    Address.fromString(address_textResolver)
  );
  let textCallResult = textResolver.try_text(event.params.node, TEXT_KEY);
  if (textCallResult.reverted) {
    log.warning("TextResolver.text reverted, node: {}, textResolver: {}", [
      event.params.node.toHexString(),
      address_textResolver,
    ]);
    return;
  }

  let projectIdFromTextRecord: BigInt;
  if (isNumberString(textCallResult.value)) {
    projectIdFromTextRecord = BigInt.fromString(textCallResult.value);
    updateV2ProjectHandle(projectIdFromTextRecord);
  }

  let ensNodeId = event.params.node.toHexString();
  let ensNode = ENSNode.load(ensNodeId);
  if (ensNode) {
    // If this ens node has already been mapped to a Project, update handle for previously mapped Project
    updateV2ProjectHandle(BigInt.fromI32(ensNode.projectId));
  } else {
    ensNode = new ENSNode(ensNodeId);
  }

  // Set ensNode.projectId to null if no projectId
  ensNode.projectId =
    projectIdFromTextRecord && projectIdFromTextRecord.gt(BigInt.fromI32(0))
      ? projectIdFromTextRecord.toI32()
      : null;
  ensNode.save();
}
