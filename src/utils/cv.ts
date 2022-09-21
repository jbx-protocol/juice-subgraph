import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { TerminalDirectory } from "../../generated/TerminalV1/TerminalDirectory";
import {
  address_v1_terminalDirectory,
  address_v1_terminalV1,
} from "../contractAddresses";
import { CV } from "../types";

export function cvForV1Project(projectId: BigInt): CV {
  if (!address_v1_terminalDirectory) return "0";

  let terminal = TerminalDirectory.bind(
    Address.fromString(address_v1_terminalDirectory!)
  );
  let callResult = terminal.try_terminalOf(projectId);

  if (callResult.reverted) {
    log.error("terminalOf reverted, project: {}, terminalDirectory: {}", [
      projectId.toHexString(),
      address_v1_terminalDirectory!,
    ]);
    // 0 will always indicate an error
    return "0";
  } else {
    return cvForTerminal(callResult.value);
  }
}

export function cvForTerminal(terminal: Address): CV {
  let _terminal = terminal.toHexString().toLowerCase();

  // Switch statement throws unclear type error in graph compiler, so we use if statements instead
  if (
    address_v1_terminalV1 &&
    _terminal == address_v1_terminalV1.toLowerCase()
  ) {
    return "1";
  }
  if (
    address_v1_terminalV1 &&
    _terminal == address_v1_terminalV1.toLowerCase()
  ) {
    return "1.1";
  }
  log.error("Invalid terminal address {}", [_terminal]);
  // 0 will always indicate an error
  return "0";
}
