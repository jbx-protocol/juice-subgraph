import {
  Address,
  BigInt,
  Bytes,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";

import { DelegateDeployed } from "../../../generated/JBTiered721DelegateDeployer3_1/JBTiered721DelegateDeployer3_1";
import { JB721Delegate3_1 as JB721Delegate3_1DataSource } from "../../../generated/templates";
import { JB721Delegate3_1 } from "../../../generated/templates/JB721Delegate3_1/JB721Delegate3_1";
import { JBTiered721DelegateStore3_1 } from "../../../generated/templates/JB721Delegate3_1/JBTiered721DelegateStore3_1";
import { PV } from "../../enums";
import { NFTCollection, NFTTier } from "../../../generated/schema";
import { idForNFTTier, idForProject } from "../../utils/ids";
import { address_shared_jbTiered721DelegateStore3_1 } from "../../contractAddresses";

const pv = PV.PV2;

export function handleDelegateDeployed(event: DelegateDeployed): void {
  const address = event.params.newDelegate;

  /**
   * Create a new dataSource to track NFT mints & transfers
   */
  const jbTiered721DelegateContext = new DataSourceContext();
  jbTiered721DelegateContext.setBigInt("projectId", event.params.projectId);
  jbTiered721DelegateContext.setString("pv", pv.toString());
  JB721Delegate3_1DataSource.createWithContext(
    address,
    jbTiered721DelegateContext
  );

  /**
   * Create collection entity
   */
  const collection = new NFTCollection(address.toHexString());
  collection.projectId = event.params.projectId.toI32();
  collection.governanceType = event.params.governanceType;
  collection.project = idForProject(event.params.projectId, pv);
  collection.createdAt = event.block.timestamp.toI32();

  const jb721DelegateContract = JB721Delegate3_1.bind(
    Address.fromBytes(address)
  );

  // Name
  const nameCall = jb721DelegateContract.try_name();
  if (nameCall.reverted) {
    log.error(
      "[jb721_v1:handleTransfer] name() reverted for jb721Delegate:{}",
      [address.toHexString()]
    );
    return;
  }
  collection.name = nameCall.value;

  // Symbol
  const symbolCall = jb721DelegateContract.try_symbol();
  if (symbolCall.reverted) {
    log.error(
      "[jb721_v1:handleTransfer] symbol() reverted for jb721Delegate:{}",
      [address.toHexString()]
    );
    return;
  }
  collection.symbol = symbolCall.value;

  collection.save();

  /**
   * Create entity for each tier in collection
   */
  if (!address_shared_jbTiered721DelegateStore3_1) {
    log.error(
      "[jb721_v1:handleTransfer] missing address_shared_jbTiered721DelegateStore3_1",
      []
    );
    return;
  }
  const jbTiered721DelegateStoreContract = JBTiered721DelegateStore3_1.bind(
    Address.fromBytes(
      Bytes.fromHexString(address_shared_jbTiered721DelegateStore3_1!)
    )
  );

  const maxTierCall = jbTiered721DelegateStoreContract.try_maxTierIdOf(address);
  if (maxTierCall.reverted) {
    // Will revert for non-tiered tokens, among maybe other reasons
    log.error(
      "[jbTiered721DelegateDeployer:handleDelegateDeployed] maxTier() reverted for address {}",
      [address.toHexString()]
    );
  }

  const tiersCall = jbTiered721DelegateStoreContract.try_tiers(
    address,
    BigInt.fromI32(0), // 0 to get all categories
    BigInt.fromI32(1),
    maxTierCall.value
  );
  if (tiersCall.reverted) {
    // Will revert for non-tiered tokens, among maybe other reasons
    log.error(
      "[jbTiered721DelegateDeployer:handleDelegateDeployed] tiers() reverted for address {}",
      [address.toHexString()]
    );
  }

  for (let i = 0; i < tiersCall.value.length; i++) {
    const tier = tiersCall.value[i];

    const nftTier = new NFTTier(idForNFTTier(address, tier.id));
    nftTier.tierId = tier.id.toI32();
    nftTier.allowManualMint = tier.allowManualMint;
    nftTier.category = tier.category.toI32();
    nftTier.price = tier.contributionFloor;
    nftTier.ipfsUri = tier.encodedIPFSUri.toString();
    nftTier.initialQuantity = tier.initialQuantity;
    nftTier.remainingQuantity = tier.remainingQuantity;
    nftTier.reservedRate = tier.reservedRate;
    nftTier.reservedTokenBeneficiary = tier.reservedTokenBeneficiary;
    nftTier.transfersPausable = tier.transfersPausable;
    nftTier.votingUnits = tier.votingUnits;
    nftTier.collection = collection.id;
    nftTier.save();
  }
}
