import { Address, BigInt, dataSource, log } from "@graphprotocol/graph-ts";
import {
  JB721Delegate,
  JB721DelegateToken,
  Participant,
} from "../../../generated/schema";
import {
  JBTiered721Delegate,
  TransferFromCall,
} from "../../../generated/templates/JBTiered721Delegate/JBTiered721Delegate";
import { CV } from "../../types";
import { newParticipant } from "../../utils/entity";
import { idForParticipant } from "../../utils/ids";

const cv: CV = "2";

export function handleTransfer(event: TransferFromCall): void {
  // Get values from context
  const context = dataSource.context();
  const address = context
    .getBytes("address")
    .toHexString()
    .toLowerCase();

  // Load jb721Delegate contract entity to get projectId
  const jb721Delegate = JB721Delegate.load(address);
  if (!jb721Delegate) {
    log.error("[handleTransfer] Missing jb721Delegate. Address:{}", [address]);
    return;
  }
  const projectId = BigInt.fromI32(jb721Delegate.projectId);

  // Update or create jb721DelegateToken
  let jb721DelegateToken = JB721DelegateToken.load(address);
  if (!jb721DelegateToken) {
    jb721DelegateToken = new JB721DelegateToken(address);
    jb721DelegateToken.jb721Delegate = address;
  }

  // Get tokenUri. (We do this every time in case tokenUri is a dynamic value)
  const contract = JBTiered721Delegate.bind(Address.fromString(address));
  const tokenUriCall = contract.try_tokenURI(event.inputs.tokenId);
  if (tokenUriCall.reverted) {
    log.error("[handleTransfer] tokenUriCall reverted for tokenId:{}", [
      event.inputs.tokenId.toString(),
    ]);
    return;
  }
  jb721DelegateToken.tokenUri = tokenUriCall.value;

  // Create participant if doesn't already exist
  let participant = Participant.load(idForParticipant(projectId, cv, event.to));
  if (!participant) participant = newParticipant(cv, projectId, event.to);
  participant.save();

  jb721DelegateToken.owner = participant.id;
  jb721DelegateToken.projectId = jb721Delegate.projectId;
  jb721DelegateToken.project = jb721Delegate.project;
  jb721DelegateToken.save();
}
