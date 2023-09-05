import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { NFTTier } from "../../../generated/schema";
import { idForNFTTier } from "../ids";

export function saveNewNFTTier(
  address: Address,
  tierId: BigInt,
  allowManualMint: boolean,
  votingUnits: BigInt,
  price: BigInt,
  initialQuantity: BigInt,
  reservedRate: BigInt,
  reservedTokenBeneficiary: Bytes,
  transfersPausable: boolean,
  timestamp: BigInt,
  encodedIPFSUri: string,
  resolvedUri: string | null = null,
  category: BigInt | null = null
): void {
  const nftTier = new NFTTier(idForNFTTier(address, tierId));
  nftTier.collection = address.toHexString();
  nftTier.tierId = tierId.toI32();
  nftTier.allowManualMint = allowManualMint;
  nftTier.votingUnits = votingUnits;
  nftTier.price = price;
  nftTier.encodedIpfsUri = encodedIPFSUri;
  nftTier.resolvedUri = resolvedUri;
  nftTier.initialQuantity = initialQuantity;
  nftTier.remainingQuantity = initialQuantity;
  nftTier.reservedRate = reservedRate;
  nftTier.reservedTokenBeneficiary = reservedTokenBeneficiary;
  nftTier.transfersPausable = transfersPausable;
  nftTier.collection = address.toHexString();
  if (category) nftTier.category = category.toI32();
  nftTier.createdAt = timestamp.toI32();
  nftTier.save();
}
