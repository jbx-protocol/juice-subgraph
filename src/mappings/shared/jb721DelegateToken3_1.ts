import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  log,
  store,
} from "@graphprotocol/graph-ts";

import { NFT, NFTTier, Participant, Project } from "../../../generated/schema";
import {
  JB721Delegate3_1,
  RemoveTier,
  Transfer,
  AddTier
} from "../../../generated/templates/JB721Delegate3_1/JB721Delegate3_1";
import { JBTiered721DelegateStore3_1 } from "../../../generated/templates/JB721Delegate3_1/JBTiered721DelegateStore3_1";
import { ADDRESS_ZERO } from "../../constants";
import { address_shared_jbTiered721DelegateStore3_1 } from "../../contractAddresses";
import { PV } from "../../enums";
import { newParticipant } from "../../utils/entities/participant";
import {
  idForNFT,
  idForNFTTier,
  idForParticipant,
  idForProject,
} from "../../utils/ids";

const pv = PV.PV2;

export function handleTransfer(event: Transfer): void {
  const context = dataSource.context();
  const projectId = context.getBigInt("projectId");
  const address = dataSource.address();
  const jb721DelegateContract = JB721Delegate3_1.bind(
    Address.fromBytes(address)
  );

  const tokenId = event.params.tokenId;

  const id = idForNFT(Address.fromBytes(address), tokenId);

  let nft = NFT.load(id);

  /**
   * If entity doesn't exist, we create and get the values that aren't expected to change.
   */
  if (!nft) {
    // Create entity
    nft = new NFT(id);
    nft.tokenId = tokenId;
    nft.project = idForProject(projectId, pv);
    nft.collection = address.toHexString();

    // Tier data
    if (!address_shared_jbTiered721DelegateStore3_1) {
      log.error(
        "[jb721_v1:handleTransfer] missing address_shared_jbTiered721DelegateStore",
        []
      );
      return;
    }
    const jbTiered721DelegateStoreContract = JBTiered721DelegateStore3_1.bind(
      Address.fromBytes(
        Bytes.fromHexString(address_shared_jbTiered721DelegateStore3_1!)
      )
    );
    const tierCall = jbTiered721DelegateStoreContract.try_tier(
      address,
      tokenId
    );
    if (tierCall.reverted) {
      // Will revert for non-tiered tokens, among maybe other reasons
      log.error(
        "[jb721_v3_1:handleTransfer] tier() reverted for address {}, tokenId {}",
        [address.toHexString(), tokenId.toString()]
      );
    }
    nft.tier = idForNFTTier(address, tierCall.value.id);
    nft.price = tierCall.value.contributionFloor;
    nft.allowManualMint = tierCall.value.allowManualMint;
    nft.category = tierCall.value.category.toI32();
    nft.ipfsUri = tierCall.value.encodedIPFSUri;
    nft.initialQuantity = tierCall.value.initialQuantity.toI32();
    nft.remainingQuantity = tierCall.value.remainingQuantity.toI32();
    nft.reservedRate = tierCall.value.reservedRate;
    nft.reservedTokenBeneficiary = tierCall.value.reservedTokenBeneficiary;
    nft.resolvedUri = tierCall.value.encodedIPFSUri.toString();
    nft.transfersPausable = tierCall.value.transfersPausable;
  }

  /**
   * Some params may change, so we update them every time the token
   * is transferred.
   */
  const tokenUriCall = jb721DelegateContract.try_tokenURI(tokenId);
  if (tokenUriCall.reverted) {
    log.error(
      "[jb721_v1:handleTransfer] tokenURI() reverted for jb721Delegate:{}",
      [id]
    );
    return;
  }
  nft.tokenUri = tokenUriCall.value;

  const receiverId = idForParticipant(projectId, pv, event.params.to);

  nft.owner = receiverId;
  nft.save();

  // Create participant if doesn't exist
  let receiver = Participant.load(receiverId);
  if (!receiver) receiver = newParticipant(pv, projectId, event.params.to);
  receiver.save();

  // Increment project stats
  if (event.params.from == ADDRESS_ZERO) {
    const idOfProject = idForProject(projectId, pv);
    const project = Project.load(idOfProject);

    if (project) {
      project.nftsMintedCount = project.nftsMintedCount + 1;
      project.save();
    } else {
      log.error("[jb721_v1:handleTransfer] Missing project. ID:{}", [
        idOfProject,
      ]);
    }
  }
}

export function handleAddTier(event: AddTier): void {
  const address = dataSource.address();

  const tier = new NFTTier(idForNFTTier(address, event.params.tierId));
  tier.category = event.params.data.category;
  tier.allowManualMint = event.params.data.allowManualMint;
  tier.price = event.params.data.contributionFloor;
  tier.ipfsUri = event.params.data.encodedIPFSUri.toString();
  tier.initialQuantity = event.params.data.initialQuantity;
  tier.reservedRate = BigInt.fromI32(event.params.data.reservedRate);
  tier.reservedTokenBeneficiary = event.params.data.reservedTokenBeneficiary;
  tier.transfersPausable = event.params.data.transfersPausable;
  tier.save();
}

export function handleRemoveTier(event: RemoveTier): void {
  const address = dataSource.address();

  store.remove("NFTTier", idForNFTTier(address, event.params.tierId));
}
