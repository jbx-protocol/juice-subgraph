import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import { JB721DelegateToken, Participant } from "../../../generated/schema";
import {
  JB721DelegateToken as JB721DelegateTokenContract,
  Transfer,
} from "../../../generated/templates/JB721DelegateToken/JB721DelegateToken";
import {
  address_shared_defifa721Delegate,
  address_shared_jbTiered721DelegateStore,
} from "../../contractAddresses";
import { Version } from "../../types";
import { newParticipant } from "../../utils/entities/participant";
import {
  idForJB721DelegateToken,
  idForParticipant,
  idForProject,
} from "../../utils/ids";

const pv: Version = "2";

export function handleTransfer(event: Transfer): void {
  const address = Bytes.fromHexString(
    address_shared_defifa721Delegate as string
  );
  const jb721DelegateTokenContract = JB721DelegateTokenContract.bind(
    Address.fromBytes(address)
  );

  // projectId
  const projectIdCall = jb721DelegateTokenContract.try_projectId();
  if (projectIdCall.reverted) {
    log.error("[handleTransfer] projectId() reverted for jb721Delegate", []);
    return;
  }
  const projectId = projectIdCall.value;

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
    token.project = idForProject(projectId, pv);

    // Name
    const nameCall = jb721DelegateTokenContract.try_name();
    if (nameCall.reverted) {
      log.error("[handleTransfer] name() reverted for jb721Delegate:{}", [id]);
      return;
    }
    token.name = nameCall.value;

    // Symbol
    const symbolCall = jb721DelegateTokenContract.try_symbol();
    if (symbolCall.reverted) {
      log.error("[handleTransfer] symbol() reverted for jb721Delegate:{}", [
        id,
      ]);
      return;
    }
    token.symbol = symbolCall.value;

    // Tier data
    if (!address_shared_jbTiered721DelegateStore) {
      log.error(
        "[handleTransfer] missing address_shared_jbTiered721DelegateStore",
        []
      );
      return;
    }
  }

  /**
   * Some params may change, so we update them every time the token
   * is transferred.
   */
  const tokenUriCall = jb721DelegateTokenContract.try_tokenURI(tokenId);
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
