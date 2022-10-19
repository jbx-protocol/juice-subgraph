import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { ProtocolLog } from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";
import { Version } from "../types";
import { toHexLowercase } from "./format";

export function idForProjectTx(
  projectId: BigInt,
  pv: Version,
  event: ethereum.Event,
  useLogIndex: boolean = false // Using log index will ensure ID is unique even if event is emitted multiple times within a single tx
): string {
  return (
    idForProject(projectId, pv) +
    "-" +
    toHexLowercase(event.transaction.hash) +
    (useLogIndex ? "-" + event.logIndex.toString() : "")
  );
}

export function idForProjectEvent(
  projectId: BigInt,
  pv: Version,
  txHash: Bytes,
  logIndex: BigInt
): string {
  return `${idForProject(projectId, pv)}-${toHexLowercase(
    txHash
  )}-${logIndex.toString()}`;
}

export function idForParticipant(
  projectId: BigInt,
  pv: Version,
  walletAddress: Bytes
): string {
  return `${idForProject(projectId, pv)}-${toHexLowercase(walletAddress)}`;
}

export function idForProject(projectId: BigInt, pv: Version): string {
  /**
   * We only use the first character of PV since project IDs don't change
   * between minor Projects versions.
   *
   * i.e. v1 & v1.1 Projects contracts share the same projectId mappings
   */
  return `${pv[0]}-${projectId.toString()}`;
}

/**
 * We use incrementing integers for all pay events, regardless of which 
 * version of the contracts being used. This helps us easily look up previous 
 * pay events when calculating trending projects, among other things.
 */
export function idForPayEvent(): string {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) {
    log.error("[idForPayEvent] Failed to load protocolLog", []);
    return "0";
  }
  return (protocolLog.paymentsCount + 1).toString();
}

export function idForPrevPayEvent(): string {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) {
    log.error("[idForPayEvent] Failed to load protocolLog", []);
    return "0";
  }
  return protocolLog.paymentsCount.toString();
}

export function idForVeNftContract(address: Address): string {
  return toHexLowercase(address);
}

export function idForJB721DelegateToken(address: Address): string {
  return toHexLowercase(address);
}
