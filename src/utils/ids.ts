import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { Version } from "../types";
import { ProtocolLog } from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";

export function idForProjectTx(
  projectId: BigInt,
  pv: Version,
  event: ethereum.Event,
  useLogIndex: boolean = false // Using log index will ensure ID is unique even if event is emitted multiple times within a single tx
): string {
  return (
    idForProject(projectId, pv) +
    "-" +
    event.transaction.hash.toHexString().toLowerCase() +
    (useLogIndex ? "-" + event.logIndex.toString() : "")
  );
}

export function idForProjectEvent(
  projectId: BigInt,
  pv: Version,
  txHash: Bytes,
  logIndex: BigInt
): string {
  return `${idForProject(
    projectId,
    pv
  )}-${txHash.toHexString().toLowerCase()}-${logIndex.toString()}`;
}

export function idForParticipant(
  projectId: BigInt,
  pv: Version,
  walletAddress: Bytes
): string {
  return `${idForProject(
    projectId,
    pv
  )}-${walletAddress.toHexString().toLowerCase()}`;
}

export function idForProject(projectId: BigInt, pv: Version): string {
  // Only use first character of PV since project IDs don't change between minor versions (i.e. 1, 1.1)
  return `${pv[0]}-${projectId.toString()}`;
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
export function idForPrevPayEvent(): string {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) {
    log.error("[idForPayEvent] Failed to load protocolLog", []);
    return "0";
  }
  return protocolLog.paymentsCount.toString();
}

export function idForVeNftContract(address: Address): string {
  return addressToLowercase(address);
}

export function idForJB721DelegateToken(address: Address): string {
  return addressToLowercase(address);
}

function addressToLowercase(address: Address): string {
  return address.toHexString().toLowerCase();
}
