import { ProtocolV2Log } from "../../../generated/schema";
import {
  Burn,
  Claim,
  Issue,
  Mint,
  Transfer,
} from "../../../generated/V2JBTokenStore/JBTokenStore";
import { PROTOCOL_ID } from "../../constants";
import {
  newProtocolV2Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import { handleV2V3Burn } from "../../utils/v2v3/tokenStore/burn";
import { handleV2V3Claim } from "../../utils/v2v3/tokenStore/claim";
import { handleV2V3Issue } from "../../utils/v2v3/tokenStore/issue";
import { handleV2V3Mint } from "../../utils/v2v3/tokenStore/mint";
import { handleV2V3Transfer } from "../../utils/v2v3/tokenStore/transfer";

export function handleBurn(event: Burn): void {
  handleV2V3Burn(
    event,
    event.params.projectId,
    event.params.holder,
    event.params.caller,
    event.params.amount,
    event.params.preferClaimedTokens
  );
}

export function handleClaim(event: Claim): void {
  handleV2V3Claim(
    event.params.projectId,
    event.params.holder,
    event.params.amount
  );
}

export function handleIssue(event: Issue): void {
  handleV2V3Issue(
    event,
    event.params.projectId,
    event.params.symbol,
    event.params.token,
    event.params.caller
  );

  let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (!protocolV2Log) protocolV2Log = newProtocolV2Log();
  if (protocolV2Log) {
    protocolV2Log.erc20Count = protocolV2Log.erc20Count + 1;
    protocolV2Log.save();
  }
  updateProtocolEntity();
}

export function handleMint(event: Mint): void {
  handleV2V3Mint(
    event.params.projectId,
    event.params.preferClaimedTokens,
    event.params.holder,
    event.params.amount
  );
}

export function handleTransfer(event: Transfer): void {
  handleV2V3Transfer(
    event.params.projectId,
    event.params.holder,
    event.params.recipient,
    event.params.amount
  );
}
