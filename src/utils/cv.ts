import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { TerminalDirectory } from "../../generated/TerminalV1/TerminalDirectory";
import { V2JBDirectory } from "../../generated/V2JBController/V2JBDirectory";
import { V3JBDirectory } from "../../generated/V2JBController/V3JBDirectory";
import {
  address_v1_terminalDirectory,
  address_v1_terminalV1,
  address_v1_terminalV1_1,
  address_v2_jbDirectory,
  address_v3_jbController,
  address_v3_jbDirectory,
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
  if (!address_v1_terminalV1 || !address_v1_terminalV1_1) return "0";

  if (_terminal == address_v1_terminalV1!.toLowerCase()) {
    return "1";
  }
  if (_terminal == address_v1_terminalV1_1!.toLowerCase()) {
    return "1.1";
  }
  log.error("Invalid terminal address {}", [_terminal]);
  // 0 will always indicate an error
  return "0";
}

// If v2 or v3 JBDirectory controllerOf == v3 JBController, return "3"
// Else return "2"
export function cvForV2_V3Project(projectId: BigInt): CV {
  if (!address_v3_jbController) return "2";

  if (address_v3_jbDirectory) {
    // Check V3 directory
    const v3Directory = V3JBDirectory.bind(
      Address.fromString(address_v3_jbDirectory!)
    );
    const v3DirectoryCallResult = v3Directory.try_controllerOf(projectId);

    if (v3DirectoryCallResult.reverted) {
      log.error("v3 controllerOf reverted, project: {}, V3JBDirectory: {}", [
        projectId.toString(),
        address_v3_jbDirectory!,
      ]);
      return "2";
    } else if (
      v3DirectoryCallResult.value.toHexString().toLowerCase() ==
      address_v3_jbController!.toLowerCase()
    ) {
      return "3";
    }
  }

  if (address_v2_jbDirectory) {
    // Check V2 directory
    const v2Directory = V2JBDirectory.bind(
      Address.fromString(address_v2_jbDirectory!)
    );
    const v2DirectoryCallResult = v2Directory.try_controllerOf(projectId);

    if (v2DirectoryCallResult.reverted) {
      log.error("v2 controllerOf reverted, project: {}, V2JBDirectory: {}", [
        projectId.toString(),
        address_v2_jbDirectory!,
      ]);
      // 0 will always indicate an error
      return "2";
    } else if (
      v2DirectoryCallResult.value.toHexString().toLowerCase() ==
      address_v3_jbController!.toLowerCase()
    ) {
      return "3";
    }
  }

  return "2";
}
