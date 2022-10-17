import { BigInt, dataSource, log } from "@graphprotocol/graph-ts";

import { ENSNode } from "../../../generated/schema";
import {
  ENSTextResolver,
  TextChanged,
  TextChanged1,
} from "../../../generated/templates/ENSTextResolver/ENSTextResolver";
import { updateProjectHandle } from "../../utils/entity";
import { isNumberString } from "../../utils/format";

// Note: DRYest method would be to read TEXT_KEY from the JBProjectHandles contract. But that would require making a contract call on every TextChanged event... which is a lot of events. So we just hard code it.
const TEXT_KEY = "juicebox_project_id";

// This handler will only work if a dataSource has been created for the resolver used by the ENS name.
// The JBProjectHandles reverse record will need to be set FIRST to create a dataSource, and the text record will need to be set again to call this handler.
export function handleTextChanged(event: TextChanged1): void {
  if (event.params.key != TEXT_KEY) return;

  log.warning("textChanged key {}", [event.params.key]);

  const address = dataSource.address();

  // Get value of text record
  const textResolver = ENSTextResolver.bind(address);
  const textCallResult = textResolver.try_text(event.params.node, TEXT_KEY);
  if (textCallResult.reverted) {
    log.warning("TextResolver.text reverted, node: {}, textResolver: {}", [
      event.params.node.toHexString(),
      address.toHexString(),
    ]);
    return;
  }

  log.warning("textChanged value {}", [textCallResult.value]);

  let projectIdFromTextRecord = 0;
  if (isNumberString(textCallResult.value)) {
    const bigInt = BigInt.fromString(textCallResult.value);
    projectIdFromTextRecord = bigInt.toI32();
    updateProjectHandle(bigInt);
  }

  const ensNodeId = event.params.node.toHexString().toLowerCase();
  let ensNode = ENSNode.load(ensNodeId);
  if (ensNode) {
    // If this ens node has already been mapped to a Project, update handle for previously mapped Project
    updateProjectHandle(BigInt.fromI32(ensNode.projectId));
  } else {
    ensNode = new ENSNode(ensNodeId);
  }

  ensNode.projectId = projectIdFromTextRecord;
  ensNode.save();
}

export function handleTextChangedWithValue(event: TextChanged): void {
  if (event.params.key != TEXT_KEY) return;

  log.warning("textChangedWithValue key, val {}, {}", [
    event.params.key,
    event.params.value,
  ]);

  let projectIdFromTextRecord = 0;
  if (isNumberString(event.params.value)) {
    const bigInt = BigInt.fromString(event.params.value);
    projectIdFromTextRecord = bigInt.toI32();
    updateProjectHandle(bigInt);
  }

  const ensNodeId = event.params.node.toHexString().toLowerCase();
  let ensNode = ENSNode.load(ensNodeId);
  if (ensNode) {
    // If this ens node has already been mapped to a Project, update handle for previously mapped Project
    updateProjectHandle(BigInt.fromI32(ensNode.projectId));
  } else {
    ensNode = new ENSNode(ensNodeId);
  }

  ensNode.projectId = projectIdFromTextRecord;
  ensNode.save();
}
