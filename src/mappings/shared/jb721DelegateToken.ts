import { Address, dataSource, log } from "@graphprotocol/graph-ts";

import { JB721DelegateToken, Participant } from "../../../generated/schema";
import { Transfer } from "../../../generated/templates/ERC20/ERC20";
import { ERC721 } from "../../../generated/templates/JB721DelegateToken/ERC721";
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
  const contract = ERC721.bind(Address.fromBytes(address));

  const id = idForJB721DelegateToken(Address.fromBytes(address));

  let token = JB721DelegateToken.load(id);

  if (!token) {
    // Create entity
    token = new JB721DelegateToken(id);

    // Only get static token details when creating entity
    const nameCall = contract.try_name();
    if (nameCall.reverted) {
      log.error("[handleTransfer] name() reverted for jb721Delegate:{}", [id]);
      return;
    }
    token.name = nameCall.value;

    const symbolCall = contract.try_symbol();
    if (symbolCall.reverted) {
      log.error("[handleTransfer] symbol() reverted for jb721Delegate:{}", [
        id,
      ]);
      return;
    }
    token.symbol = symbolCall.value;

    token.address = address;
    token.projectId = projectId.toI32();
    token.project = idForProject(projectId, pv);
  }

  // Always update dynamic fields tokenURI and owner
  const tokenUriCall = contract.try_tokenURI(event.params.value);
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
