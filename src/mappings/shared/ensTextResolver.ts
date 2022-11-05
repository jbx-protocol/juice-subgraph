import { BigInt, Bytes, dataSource, log } from "@graphprotocol/graph-ts";

import { ENSNode } from "../../../generated/schema";
import {
  ENSTextResolver,
  TextChanged,
  TextChanged1,
} from "../../../generated/templates/ENSTextResolver/ENSTextResolver";
import { updateProjectHandle } from "../../utils/entity";
import { isNumberString, toHexLowercase } from "../../utils/format";

/**
 * Note: DRYest method would be to read TEXT_KEY from the JBProjectHandles
 * contract. But that would require making a contract call on every
 * TextChanged event... which is a lot of events. So we just hard code it.
 */
const TEXT_KEY = "juicebox_project_id";

/**
 * Because different text resolver contracts may use different interfaces,
 * we use the following two handlers for two commonly emitted events.
 * The only difference is that one emits the new value of the text record
 * when changed, while the other doesn't.
 *
 * These handlers will only work if a dataSource has been created for the
 * resolver used by the ENS name.
 *
 * The JBProjectHandles reverse record will need to be set FIRST to create
 * a dataSource, and the text record will need to be set again to call
 * this handler.
 */
export function handleTextChanged(event: TextChanged1): void {
  if (event.params.key != TEXT_KEY) return;

  const address = dataSource.address();

  /**
   * If text record value isn't emitted from event, get it via contract call
   */
  const textResolver = ENSTextResolver.bind(address);
  const textCallResult = textResolver.try_text(event.params.node, TEXT_KEY);
  if (textCallResult.reverted) {
    log.error("TextResolver.text reverted, node: {}, textResolver: {}", [
      event.params.node.toHexString(),
      address.toHexString(),
    ]);
    return;
  }

  _handleTextChanged(
    textCallResult.value,
    event.params.node,
    event.block.number
  );
}

export function handleTextChangedWithValue(event: TextChanged): void {
  if (event.params.key != TEXT_KEY) return;

  _handleTextChanged(event.params.value, event.params.node, event.block.number);
}

function _handleTextChanged(
  textRecordValue: string,
  node: Bytes,
  blockNumber: BigInt
): void {
  let projectIdFromTextRecord = 0;
  if (isNumberString(textRecordValue)) {
    const bigInt = BigInt.fromString(textRecordValue);
    projectIdFromTextRecord = bigInt.toI32();
    updateProjectHandle(bigInt, blockNumber);
  }

  const ensNodeId = toHexLowercase(node);
  let ensNode = ENSNode.load(ensNodeId);
  if (ensNode) {
    /**
     * If this ens node has already been mapped to a Project,
     * update handle for whatever Project it was previously mapped to.
     *
     * Example: If a Project ENS name is moved to a different project,
     * this ensures the old Project doesn't keep the handle.
     */
    updateProjectHandle(BigInt.fromI32(ensNode.projectId), blockNumber);
  } else {
    ensNode = new ENSNode(ensNodeId);
  }

  ensNode.projectId = projectIdFromTextRecord;
  ensNode.save();
}
