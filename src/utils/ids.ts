import { BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { CV } from "../types";
import { ProtocolLog } from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";

export function idForProjectTx(
  projectId: BigInt,
  cv: CV,
  event: ethereum.Event,
  useLogIndex: boolean = false // Using log index will ensure ID is unique even if event is emitted multiple times within a single tx
): string {
  return (
    idForProject(projectId, cv) +
    "-" +
    event.transaction.hash.toHexString().toLowerCase() +
    (useLogIndex ? "-" + event.logIndex.toString() : "")
  );
}

export function idForProjectEvent(
  projectId: BigInt,
  cv: CV,
  txHash: Bytes,
  logIndex: BigInt
): string {
  return `${idForProject(
    projectId,
    cv
  )}-${txHash.toHexString().toLowerCase()}-${logIndex.toString()}`;
}

export function idForParticipant(
  projectId: BigInt,
  cv: CV,
  walletAddress: Bytes
): string {
  return `${idForProject(
    projectId,
    cv
  )}-${walletAddress.toHexString().toLowerCase()}`;
}

export function idForProject(projectId: BigInt, cv: CV): string {
  // Only use first character of CV since project IDs are unique across v1 and v1.1
  return `${cv[0]}-${projectId.toString()}`;
}

// Use incrementing integers for PayEvent IDs
export function idForPayEvent(): string {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) {
    log.error("[idForPayEvent] Failed to load protocolLog", []);
    return "0";
  }
  return (protocolLog.paymentsCount + 1).toString();
}
