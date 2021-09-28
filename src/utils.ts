import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export function idForParticipant(projectId: BigInt, walletAddress: Bytes): string {
  return projectId.toString() + "-" + walletAddress.toHexString();
}
