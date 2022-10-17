import {
  Address,
  ByteArray,
  Bytes,
  crypto,
  log,
} from "@graphprotocol/graph-ts";

import { ENSRegistry } from "../../../generated/JBProjectHandles/ENSRegistry";
import { SetEnsNameParts } from "../../../generated/JBProjectHandles/JBProjectHandles";
import { ENSTextResolver } from "../../../generated/templates";
import { address_shared_ensRegistry } from "../../contractAddresses";
import { updateProjectHandle } from "../../utils/entity";

function namehash(parts: string[]): Bytes {
  // Reject empty names:
  let node = "";
  for (let i = 0; i < 32; i++) {
    node += "00";
  }

  // Note: this function should start with the ending part ("eth"). This is how `parts` is emitted from JBProjectHandles contract, so no need to reverse iterate
  for (let i = 0; i < parts.length; i++) {
    // TODO should normalize parts[i], but graph-ts doesn't support UTS46
    // https://docs.ens.domains/contract-api-reference/name-processing#normalising-names
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

// Every time setEnsNameParts() is called, we create a context to listen to the TextResolver of that ens node. We _could_ check if the resolver supports Text interface, but nothing breaks if it doesn't and not checking saves us a contract call.
export function handleSetEnsNameParts(event: SetEnsNameParts): void {
  if (!address_shared_ensRegistry) return;

  const parts = event.params.parts;
  parts.unshift("eth");

  const node = namehash(parts);

  // For some reason Address.fromHexString() doesn't work here :facepalm:
  const address = Address.fromBytes(
    Bytes.fromHexString(address_shared_ensRegistry!)
  );

  const resolverCall = ENSRegistry.bind(address).try_resolver(node);
  if (resolverCall.reverted) {
    log.error("[handleSetEnsNameParts] resolver() reverted for node {}", [
      node.toHexString(),
    ]);
    return;
  }

  log.warning("creating dataSource for node {}, parts {}, resolver {}", [
    node.toHexString(),
    parts.toString(),
    resolverCall.value.toHexString(),
  ]);

  updateProjectHandle(event.params.projectId);

  // TODO is it a problem if context will be created multiple times for single resolver? Any way to check if context for address has already been created?
  ENSTextResolver.create(resolverCall.value);
}
