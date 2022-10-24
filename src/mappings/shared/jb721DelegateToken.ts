import { Address, Bytes, dataSource, log } from "@graphprotocol/graph-ts";

import { JB721DelegateToken, Participant } from "../../../generated/schema";
import { Transfer } from "../../../generated/templates/ERC20/ERC20";
import { ERC721 } from "../../../generated/templates/JB721DelegateToken/ERC721";
import { JBTiered721DelegateStore } from "../../../generated/templates/JB721DelegateToken/JBTiered721DelegateStore";
import {
  address_v3_jbTiered721DelegateStore,
} from "../../contractAddresses";
import { newParticipant } from "../../utils/entity";
import {
  idForJB721DelegateToken,
  idForParticipant,
  idForProject,
} from "../../utils/ids";

export function handleTransfer(event: Transfer): void {
  const context = dataSource.context();
  const projectId = context.getBigInt("projectId");
  const pv = context.getString("pv");
  const address = dataSource.address();
  const jbTiered721DelegateContract = ERC721.bind(Address.fromBytes(address));

  const tokenId = event.params.value;

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
    token.project = idForProject(projectId, pv);

    // Name
    const nameCall = jbTiered721DelegateContract.try_name();
    if (nameCall.reverted) {
      log.error("[handleTransfer] name() reverted for jb721Delegate:{}", [id]);
      return;
    }
    token.name = nameCall.value;

    // Symbol
    const symbolCall = jbTiered721DelegateContract.try_symbol();
    if (symbolCall.reverted) {
      log.error("[handleTransfer] symbol() reverted for jb721Delegate:{}", [
        id,
      ]);
      return;
    }
    token.symbol = symbolCall.value;

    // Tier data
    if (!address_v3_jbTiered721DelegateStore) {
      log.error(
        "[handleTransfer] missing address_v3_jbTiered721DelegateStore",
        []
      );
      return;
    }
    const jbTiered721DelegateStoreContract = JBTiered721DelegateStore.bind(
      Address.fromBytes(
        Bytes.fromHexString(address_v3_jbTiered721DelegateStore!)
      )
    );
    const tierCall = jbTiered721DelegateStoreContract.try_tier(
      address,
      tokenId
    );
    if (tierCall.reverted) {
      log.error("[handleTransfer] tier() reverted for address {}, tokenId {}", [
        address.toHexString(),
        tokenId.toString(),
      ]);
      return;
    }
    token.floorPrice = tierCall.value.contributionFloor;
    token.lockedUntil = tierCall.value.lockedUntil;
  }

  /**
   * Some params may change, so we update them every time the token
   * is transferred.
   */
  const tokenUriCall = jbTiered721DelegateContract.try_tokenURI(
    event.params.value
  );
  if (tokenUriCall.reverted) {
    log.error("[handleTransfer] tokenURI() reverted for jb721Delegate:{}", [
      id,
    ]);
    return;
  }
  token.tokenUri = tokenUriCall.value;

  const receiverId = idForParticipant(projectId, pv, event.params.to);

  token.owner = receiverId;
  token.save();

  // Create participant if doesn't exist
  let receiver = Participant.load(receiverId);
  if (!receiver) receiver = newParticipant(pv, projectId, event.params.to);

  receiver.save();
}
