import { Address, Bytes, crypto, log } from "@graphprotocol/graph-ts";

import { ENSRegistry } from "../../../generated/JBProjectHandles/ENSRegistry";
import { SetEnsNameParts } from "../../../generated/JBProjectHandles/JBProjectHandles";
import { ENSTextResolver } from "../../../generated/templates";
import { address_shared_ensRegistry } from "../../contractAddresses";
import { updateProjectHandle } from "../../utils/entities/project";

/**
 * Borrowed from https://github.com/Arachnid/eth-ens-namehash/blob/d3a6cc4e3780b04fb0fb742e80f2c9702e91c41f/index.js
 *
 * With some hacking around to make it work in assemblyscript.
 * This could prolly be improved
 */
function namehash(parts: string[]): Bytes {
  let node = "";
  for (let i = 0; i < 32; i++) {
    node += "00";
  }

  /**
   * Note: the next loop should iterate in reverse (starting with "eth").
   * But this is how parts are emitted from the JBProjectHandles contract
   * so all good. We do however need to add "eth"
   */
  parts.unshift("eth");

  for (let i = 0; i < parts.length; i++) {
    /**
     * TODO should maybe normalize parts[i], but graph-ts doesn't support UTS46
     * https://docs.ens.domains/contract-api-reference/name-processing#normalising-names
     */
    node = crypto
      .keccak256(
        Bytes.fromHexString(
          node +
            crypto
              .keccak256(Bytes.fromUTF8(parts[i]))
              .toHexString()
              .substring(2) // Strip leading "0x"
        )
      )
      .toHexString()
      .substring(2); // Strip leading "0x"
  }

  return Bytes.fromHexString("0x" + node);
}

/**
 * Every time setEnsNameParts() is called, we create a context to listen to
 * the TextResolver of that ens node. We _could_ check if the resolver
 * supports Text interface, but nothing breaks if it doesn't and not checking
 * saves us a contract call.
 */
export function handleSetEnsNameParts(event: SetEnsNameParts): void {
  if (!address_shared_ensRegistry) return;

  /**
   * Note: It's possible this will be called by the legacy JBProjectHandles
   * contract (if one exists for the network). We may want to stop indexing
   * events from the legacy contract if the block height is past the deploy
   * block of the current JBProjectHandles contract. But shouldn't matter.
   */

  const parts = event.params.parts;

  const node = namehash(parts);

  /**
   * Address.fromHexString() fails inexplicably while indexing because graph
   */
  const registryAddress = Address.fromBytes(
    Bytes.fromHexString(address_shared_ensRegistry!)
  );

  const resolverCall = ENSRegistry.bind(registryAddress).try_resolver(node);
  if (resolverCall.reverted) {
    log.error("[handleSetEnsNameParts] resolver() reverted for node {}", [
      node.toHexString(),
    ]);
    return;
  }

  updateProjectHandle(event.params.projectId, event.block.number);

  /**
   * No worries if dataSource has already been created for the resolver,
   * it won't be created twice.
   * Afaik there's no way to check if a dataSource already exists
   */
  ENSTextResolver.create(resolverCall.value);
}
