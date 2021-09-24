import { BigInt } from "@graphprotocol/graph-ts";

import { TokenHolder } from "../generated/schema";
import { trackTokensForProjectIds } from "./trackTokensForProjectIds";
import { TransferEvent } from "./types";

export const hasTrackedTokens = (projectId: BigInt): boolean =>
  trackTokensForProjectIds.includes(projectId.toI32());

export function handleERC20Transfer(
  projectId: BigInt,
  event: TransferEvent
): void {
  let senderTokenHolder = TokenHolder.load(
    projectId.toHexString() + "-" + event.params.from.toHexString()
  );

  let receiverId =
    projectId.toHexString() + "-" + event.params.to.toHexString();
  let receiverTokenHolder = TokenHolder.load(receiverId);

  if (!receiverTokenHolder && hasTrackedTokens(projectId)) {
    receiverTokenHolder = new TokenHolder(receiverId);
    receiverTokenHolder.project = projectId.toHexString();
    receiverTokenHolder.address = event.params.to;
    receiverTokenHolder.balance = new BigInt(0);
  }

  if (receiverTokenHolder) {
    receiverTokenHolder.balance = receiverTokenHolder.balance.plus(
      event.params.value
    );
    receiverTokenHolder.save();
  }

  if (senderTokenHolder) {
    senderTokenHolder.balance = senderTokenHolder.balance.minus(
      event.params.value
    );
    senderTokenHolder.save();
  }
}
