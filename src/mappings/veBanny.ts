import { log } from "@graphprotocol/graph-ts";
import {
  ExtendLock,
  JVeBanny,
  JVeBanny__lockedResult,
  Lock,
  Redeem,
  Transfer,
  Unlock,
} from "../../generated/JVeBanny/JVeBanny";
import { VeNftToken } from "../../generated/schema";

export function handleLock(event: Lock): void {
  let token = new VeNftToken(event.params.tokenId.toHexString().toLowerCase());
  if (!token) return;

  token.createdAt = event.block.timestamp.toI32();
  token.tokenId = event.params.tokenId.toI32();
  token.owner = event.params.beneficiary;
  token.participant = event.params.beneficiary.toHexString();
  token.unlockedAt = 0;

  const tokenContract = JVeBanny.bind(event.address);
  const tokenUriCall = tokenContract.try_tokenURI(event.params.tokenId);
  if (tokenUriCall.reverted) {
    log.error("[handleLock] tokenUri call reverted. tokenId:{}", [
      event.params.tokenId.toString(),
    ]);
  } else {
    token.tokenUri = tokenUriCall.value;
  }

  const lockInfoDataCall = tokenContract.try_locked(event.params.tokenId);
  let lockInfoData: JVeBanny__lockedResult | null = null;
  if (lockInfoDataCall.reverted) {
    log.error("[handleLock] locked call reverted. tokenId:{}", [
      event.params.tokenId.toString(),
    ]);
  } else {
    lockInfoData = lockInfoDataCall.value;
    token.lockAmount = lockInfoData.value0;
    token.lockEnd = lockInfoData.value1.toI32();
    token.lockDuration = lockInfoData.value2.toI32();
    token.lockUseJbToken = lockInfoData.value3;
    token.lockAllowPublicExtension = lockInfoData.value4;
    token.save();
  }
}

export function handleExtendLock(event: ExtendLock): void {
  const token = VeNftToken.load(
    event.params.oldTokenID.toHexString().toLowerCase()
  );
  if (!token) return;

  token.lockDuration = event.params.updatedDuration.toI32();

  // TODO: Fix when updatedLockEnd is fixed
  const tokenContract = JVeBanny.bind(event.address);
  const lockInfoDataCall = tokenContract.try_locked(event.params.oldTokenID);
  let lockInfoData: JVeBanny__lockedResult | null = null;
  if (lockInfoDataCall.reverted) {
    log.error("[handleExtendLock] locked call reverted. tokenId:{}", [
      event.params.oldTokenID.toString(),
    ]);
  } else {
    lockInfoData = lockInfoDataCall.value;
    token.lockEnd = lockInfoData.value1.toI32();
    token.save();
  }
}

export function handleUnlock(event: Unlock): void {
  let token = VeNftToken.load(event.params.tokenId.toHexString().toLowerCase());
  if (!token) return;

  token.unlockedAt = event.block.timestamp.toI32();
  token.save();
}

export function handleRedeem(event: Redeem): void {
  let token = VeNftToken.load(event.params.tokenId.toHexString().toLowerCase());
  if (!token) return;

  token.redeemedAt = event.block.timestamp.toI32();
  token.save();
}

export function handleTransfer(event: Transfer): void {
  const token = VeNftToken.load(
    event.params.tokenId.toHexString().toLowerCase()
  );
  if (!token) return;

  token.owner = event.params.to;
  token.save();
}
