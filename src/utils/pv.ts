import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { TerminalDirectory } from "../../generated/TerminalV1/TerminalDirectory";
import {
  address_v1_terminalDirectory,
  address_v1_terminalV1,
  address_v1_terminalV1_1,
} from "../contractAddresses";
import { Version } from "../types";
import { toHexLowercase } from "./format";

export function pvForV1Project(projectId: BigInt): Version {
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
    // 0 will indicate something very bad has happened
    return "0";
  } else {
    return pvForTerminal(callResult.value);
  }
}

export function pvForTerminal(terminal: Address): Version {
  let _terminal = toHexLowercase(terminal);

  /**
   * Switch statement doesn't compile into assemblyScript, so we do some
   * if statements instead
   */
  if (!address_v1_terminalV1 || !address_v1_terminalV1_1) return "0";

  if (_terminal == address_v1_terminalV1!.toLowerCase()) return "1";

  if (_terminal == address_v1_terminalV1_1!.toLowerCase()) return "1.1";

  log.error("Invalid terminal address {}", [_terminal]);

  // 0 will indicate something very bad has happened
  return "0";
}
