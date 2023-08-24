import { Address, Bytes, dataSource, log } from "@graphprotocol/graph-ts";

import {
  JB721DelegateToken,
  Participant,
  Project,
} from "../../../generated/schema";
import {
  JB721Delegate3_3,
  Transfer,
} from "../../../generated/templates/JB721Delegate3_3/JB721Delegate3_3";
import { JBTiered721DelegateStore3_3 } from "../../../generated/templates/JB721Delegate3_3/JBTiered721DelegateStore3_3";
import { ADDRESS_ZERO } from "../../constants";
import { address_shared_jbTiered721DelegateStore3_3 } from "../../contractAddresses";
import { PV } from "../../enums";
import { newParticipant } from "../../utils/entities/participant";
import {
  idForJB721DelegateToken,
  idForParticipant,
  idForProject,
} from "../../utils/ids";

export function handleTransfer(event: Transfer): void {
  const context = dataSource.context();
  const projectId = context.getBigInt("projectId");
  const pv = context.getString("pv") === "1" ? PV.PV1 : PV.PV2;
  const governanceType = context.getI32("governanceType");
  const address = dataSource.address();
  const jb721DelegateContract = JB721Delegate3_3.bind(
    Address.fromBytes(address)
  );

  const tokenId = event.params.tokenId;

  const id = idForJB721DelegateToken(Address.fromBytes(address), tokenId);

  let token = JB721DelegateToken.load(id);

  /**
   * If entity doesn't exist, we create and get the values that aren't expected to change.
   */
  if (!token) {
    // Create entity
    token = new JB721DelegateToken(id);
    token.tokenId = tokenId;
    token.address = address;
    token.projectId = projectId.toI32();
    token.governanceType = governanceType;
    token.project = idForProject(projectId, pv);

    // Name
    const nameCall = jb721DelegateContract.try_name();
    if (nameCall.reverted) {
      log.error(
        "[jb721_v1:handleTransfer] name() reverted for jb721Delegate:{}",
        [id]
      );
      return;
    }
    token.name = nameCall.value;

    // Symbol
    const symbolCall = jb721DelegateContract.try_symbol();
    if (symbolCall.reverted) {
      log.error(
        "[jb721_v1:handleTransfer] symbol() reverted for jb721Delegate:{}",
        [id]
      );
      return;
    }
    token.symbol = symbolCall.value;

    // Tier data
    if (!address_shared_jbTiered721DelegateStore3_3) {
      log.error(
        "[jb721_v1:handleTransfer] missing address_shared_jbTiered721DelegateStore",
        []
      );
      return;
    }
    const jbTiered721DelegateStoreContract = JBTiered721DelegateStore3_3.bind(
      Address.fromBytes(
        Bytes.fromHexString(address_shared_jbTiered721DelegateStore3_3!)
      )
    );
    const tierCall = jbTiered721DelegateStoreContract.try_tierOf(
      address,
      tokenId,
      true
    );
    if (tierCall.reverted) {
      // Will revert for non-tiered tokens, among maybe other reasons
      log.error(
        "[jb721_v1:handleTransfer] tier() reverted for address {}, tokenId {}",
        [address.toHexString(), tokenId.toString()]
      );
    }
    token.floorPrice = tierCall.value.price;
    token.allowManualMint = tierCall.value.allowManualMint;
    token.category = tierCall.value.category.toI32();
    token.encodedIPFSUri = tierCall.value.encodedIPFSUri;
    token.initialQuantity = tierCall.value.initialQuantity.toI32();
    token.remainingQuantity = tierCall.value.remainingQuantity.toI32();
    token.reservedRate = tierCall.value.reservedRate;
    token.reservedTokenBeneficiary = tierCall.value.reservedTokenBeneficiary;
    token.resolvedUri = tierCall.value.resolvedUri;
    token.transfersPausable = tierCall.value.transfersPausable;
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
  token.tokenUri = tokenUriCall.value;

  const receiverId = idForParticipant(projectId, pv, event.params.to);

  token.owner = receiverId;
  token.save();

  // Create participant if doesn't exist
  let receiver = Participant.load(receiverId);
  if (!receiver) receiver = newParticipant(pv, projectId, event.params.to);

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
      return;
    }
  }

  receiver.save();
}