import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { ENSNode } from "../../../generated/schema";
import {
  TextChanged,
  TextResolver,
} from "../../../generated/TextResolver/TextResolver";
import { address_textResolver } from "../../contractAddresses";
import { updateV2ProjectHandle } from "../../utils/entity";
import { isNumberString } from "../../utils/format";

// Note: DRYest method would be to read TEXT_KEY from the JBProjectHandles contract. But that would require making a contract call on every TextChanged event... which is a lot of events. So we just hard code it.
const TEXT_KEY = "juicebox_project_id";

export function handleTextChanged(event: TextChanged): void {
  if (event.params.key != TEXT_KEY) return;

  // Get value of text record
  const textResolver = TextResolver.bind(
    Address.fromString(address_textResolver)
  );
  const textCallResult = textResolver.try_text(event.params.node, TEXT_KEY);
  if (textCallResult.reverted) {
    log.warning("TextResolver.text reverted, node: {}, textResolver: {}", [
      event.params.node.toHexString(),
      address_textResolver,
    ]);
    return;
  }

  let projectIdFromTextRecord = 0;
  if (isNumberString(textCallResult.value)) {
    projectIdFromTextRecord = BigInt.fromString(textCallResult.value).toI32();
    updateV2ProjectHandle(BigInt.fromString(textCallResult.value));
  }

  const ensNodeId = event.params.node.toHexString().toLowerCase();
  let ensNode = ENSNode.load(ensNodeId);
  if (ensNode) {
    // If this ens node has already been mapped to a Project, update handle for previously mapped Project
    updateV2ProjectHandle(BigInt.fromI32(ensNode.projectId));
  } else {
    ensNode = new ENSNode(ensNodeId);
  }
  // Annoying graph-ts null check
  ensNode.projectId = projectIdFromTextRecord;
  ensNode.save();
}
