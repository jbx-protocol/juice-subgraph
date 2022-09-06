import { log } from "@graphprotocol/graph-ts";
import { VeNftContract, VeNftToken } from "../../../generated/schema";
import {
  JBVeNft,
  ExtendLock,
  Lock,
  Redeem,
  Transfer,
  Unlock,
  JBVeNft
} from "../../../generated/templates/JBVeNft/JBVeNft";
import { idForVeNftContract } from "../../utils/ids";

export function handleLock(event: Lock): void {
  const token = new VeNftToken(
    event.params.tokenId.toHexString().toLowerCase()
  );
  if (!token) return;

  token.createdAt = event.block.timestamp.toI32();
  token.tokenId = event.params.tokenId.toI32();
  token.owner = event.params.beneficiary;
  token.participant = event.params.beneficiary.toHexString();
  token.unlockedAt = 0;

  const tokenContract = JBVeNft.bind(event.address);

  const projectIdCall = tokenContract.try_projectId();
  if (projectIdCall.reverted) {
    log.warning("ProjectId not found", []);
    return;
  } else {
    const contractId = idForVeNftContract(event.address);
    const contract = VeNftContract.load(contractId);
    if (!contract) {
      log.warning("Contract not found", []);
      return;
    }
    token.contract = contract.id;
    token.contractAddress = contract.address;
  }

  const tokenUriCall = tokenContract.try_tokenURI(event.params.tokenId);
  if (tokenUriCall.reverted) {
    log.error("[handleLock] tokenUri call reverted. tokenId:{}", [
      event.params.tokenId.toString(),
    ]);
  } else {
    token.tokenUri = tokenUriCall.value;
  }

  const lockInfoDataCall = tokenContract.try_locked(event.params.tokenId);
  if (lockInfoDataCall.reverted) {
    log.error("[handleLock] locked call reverted. tokenId:{}", [
      event.params.tokenId.toString(),
    ]);
  } else {
    const lockInfoData = lockInfoDataCall.value;
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
  const tokenContract = JBVeNft.bind(event.address);
  const lockInfoDataCall = tokenContract.try_locked(event.params.oldTokenID);
  if (lockInfoDataCall.reverted) {
    log.error("[handleExtendLock] locked call reverted. tokenId:{}", [
      event.params.oldTokenID.toString(),
    ]);
  } else {
    token.lockEnd = lockInfoDataCall.value.value1.toI32();
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
