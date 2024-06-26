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
  AddTier,
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
import { saveNewNFTTier } from "../../utils/entities/nft";

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
    nft.projectId = projectId.toI32();
    nft.project = idForProject(projectId, pv);
    nft.collection = address.toHexString();

    // Tier data
    if (!address_shared_jbTiered721DelegateStore3_1) {
      log.error(
        "[jb721_3_1:handleTransfer] missing address_shared_jbTiered721DelegateStore",
        []
      );
      return;
    }
    const jbTiered721DelegateStoreContract = JBTiered721DelegateStore3_1.bind(
      Address.fromBytes(
        Bytes.fromHexString(address_shared_jbTiered721DelegateStore3_1!)
      )
    );
    const tierCall = jbTiered721DelegateStoreContract.try_tierOfTokenId(
      address,
      tokenId
    );
    if (tierCall.reverted) {
      // Will revert for non-tiered tokens, among maybe other reasons
      log.error(
        "[jb721_v3_1:handleTransfer] tierOfTokenId() reverted for address {}, tokenId {}",
        [address.toHexString(), tokenId.toString()]
      );
      return;
    }
    const tierId = idForNFTTier(address, tierCall.value.id);
    const tier = NFTTier.load(tierId);

    if (tier) {
      nft.tier = tierId;

      tier.remainingQuantity = tierCall.value.remainingQuantity;
      tier.save();
    } else {
      // Will revert for non-tiered tokens, among maybe other reasons
      log.error(
        "[jb721_v3_1:handleTransfer] missing tier for token with address {}, tokenId {}, tierId {}",
        [
          address.toHexString(),
          tokenId.toString(),
          tierCall.value.id.toString(),
        ]
      );
    }
  }

  /**
   * Some params may change, so we update them every time the token
   * is transferred.
   */
  const tokenUriCall = jb721DelegateContract.try_tokenURI(tokenId);
  if (tokenUriCall.reverted) {
    log.error(
      "[jb721_3_1:handleTransfer] tokenURI() reverted for jb721Delegate:{}",
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
      log.error("[jb721_3_1:handleTransfer] Missing project. ID:{}", [
        idOfProject,
      ]);
    }
  }
}

export function handleAddTier(event: AddTier): void {
  const address = dataSource.address();

  const data = event.params.data;

  saveNewNFTTier(
    address,
    event.params.tierId,
    data.allowManualMint,
    BigInt.fromI32(data.votingUnits),
    data.contributionFloor,
    data.initialQuantity,
    BigInt.fromI32(data.reservedRate),
    data.reservedTokenBeneficiary,
    data.transfersPausable,
    event.block.timestamp,
    data.encodedIPFSUri.toHexString(),
    null,
    BigInt.fromI32(data.category)
  );
}

export function handleRemoveTier(event: RemoveTier): void {
  const address = dataSource.address();

  store.remove("NFTTier", idForNFTTier(address, event.params.tierId));
}
