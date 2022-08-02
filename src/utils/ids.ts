import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { ProtocolLog } from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";
import { CV } from "../types";

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
  return `${cv}-${projectId.toString()}`;
}
