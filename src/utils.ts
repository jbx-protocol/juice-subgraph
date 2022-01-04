import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Participant } from "../generated/schema";
import { indexedProjectERC20s } from "./mappings/projectTokens";

export function idForParticipant(
  projectId: BigInt,
  walletAddress: Bytes
): string {
  return projectId.toString() + "-" + walletAddress.toHexString().toLowerCase();
}

export function erc20IsIndexed(projectId: BigInt): boolean {
  return indexedProjectERC20s.includes(projectId.toString());
}

export function updateBalance(participant: Participant): void {
  participant.balance = participant.unstakedBalance.plus(
    participant.stakedBalance
  );
}
