import {
  Address,
  BigInt,
  Bytes,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";

import { DelegateDeployed } from "../../../generated/JBTiered721DelegateDeployer3/JBTiered721DelegateDeployer3";
import { JBTiered721DelegateStore3 } from "../../../generated/JBTiered721DelegateDeployer3/JBTiered721DelegateStore3";
import { JB721Delegate3 } from "../../../generated/JBTiered721DelegateDeployer3/JB721Delegate3";
import { JB721Delegate3 as JB721Delegate3DataSource } from "../../../generated/templates";
import { PV } from "../../enums";
import { idForProject } from "../../utils/ids";
import { NFTCollection } from "../../../generated/schema";
import { address_shared_jbTiered721DelegateStore3 } from "../../contractAddresses";
import { saveNewNFTTier } from "../../utils/entities/nft";

const pv = PV.PV2;

export function handleDelegateDeployed(event: DelegateDeployed): void {
  const address = event.params.newDelegate;

  /**
   * Create a new dataSource to track NFT mints & transfers
   */
  const jbTiered721DelegateContext = new DataSourceContext();
  jbTiered721DelegateContext.setBigInt("projectId", event.params.projectId);
  jbTiered721DelegateContext.setString("pv", pv.toString());
  JB721Delegate3DataSource.createWithContext(
    address,
    jbTiered721DelegateContext
  );

  /**
   * Create collection entity
   */
  const collection = new NFTCollection(address.toHexString());
  collection.address = address;
  collection.projectId = event.params.projectId.toI32();
  collection.governanceType = event.params.governanceType;
  collection.project = idForProject(event.params.projectId, pv);
  collection.createdAt = event.block.timestamp.toI32();

  const jb721DelegateContract = JB721Delegate3.bind(Address.fromBytes(address));

  // Name
  const nameCall = jb721DelegateContract.try_name();
  if (nameCall.reverted) {
    log.error(
      "[jbTiered721DelegateDeployer_3:handleDelegateDeployed] name() reverted for {}",
      [address.toHexString()]
    );
    return;
  }
  collection.name = nameCall.value;

  // Symbol
  const symbolCall = jb721DelegateContract.try_symbol();
  if (symbolCall.reverted) {
    log.error(
      "[jbTiered721DelegateDeployer_3:handleDelegateDeployed] symbol() reverted for {}",
      [address.toHexString()]
    );
    return;
  }
  collection.symbol = symbolCall.value;

  collection.save();

  /**
   * Create entity for each tier in collection
   */
  if (!address_shared_jbTiered721DelegateStore3) {
    log.error(
      "[jbTiered721DelegateDeployer_3:handleDelegateDeployed] missing address_shared_jbTiered721DelegateStore",
      []
    );
    return;
  }

  const jbTiered721DelegateStoreContract = JBTiered721DelegateStore3.bind(
    Address.fromBytes(
      Bytes.fromHexString(address_shared_jbTiered721DelegateStore3!)
    )
  );

  const maxTierCall = jbTiered721DelegateStoreContract.try_maxTierIdOf(address);
  if (maxTierCall.reverted) {
    // Will revert for non-tiered tokens, among maybe other reasons
    log.error(
      "[jbTiered721DelegateDeployer_3:handleDelegateDeployed] maxTier() reverted for {}",
      [address.toHexString()]
    );
    return;
  }

  const tiersCall = jbTiered721DelegateStoreContract.try_tiers(
    address,
    BigInt.fromI32(1),
    maxTierCall.value
  );
  if (tiersCall.reverted) {
    // Will revert for non-tiered tokens, among maybe other reasons
    log.error(
      "[jbTiered721DelegateDeployer:handleDelegateDeployed] tiers() reverted for {}",
      [address.toHexString()]
    );
    return;
  }

  for (let i = 0; i < tiersCall.value.length; i++) {
    const tier = tiersCall.value[i];

    saveNewNFTTier(
      address,
      tier.id,
      tier.allowManualMint,
      tier.votingUnits,
      tier.contributionFloor,
      tier.initialQuantity,
      tier.reservedRate,
      tier.reservedTokenBeneficiary,
      tier.transfersPausable,
      event.block.timestamp,
      tier.encodedIPFSUri.toHexString()
    );
  }
}
