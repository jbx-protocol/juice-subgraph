import { dataSource } from "@graphprotocol/graph-ts";

import { ETHERC20ProjectPayer } from "../../../generated/schema";
import {
  OwnershipTransferred,
  SetDefaultValues,
} from "../../../generated/templates/JBETHERC20ProjectPayer/JBETHERC20ProjectPayer";
import { Version } from "../../types";
import { idForProject } from "../../utils/ids";

const pv: Version = "2";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const address = dataSource
    .address()
    .toHexString()
    .toLowerCase();
  const projectPayer = ETHERC20ProjectPayer.load(address);
  if (!projectPayer) return;
  projectPayer.owner = event.params.newOwner;
  projectPayer.save();
}

export function handleSetDefaultValues(event: SetDefaultValues): void {
  const address = dataSource
    .address()
    .toHexString()
    .toLowerCase();
  const projectPayer = ETHERC20ProjectPayer.load(address);
  if (!projectPayer) return;
  projectPayer.beneficiary = event.params.beneficiary;
  projectPayer.memo = event.params.memo;
  projectPayer.metadata = event.params.metadata;
  projectPayer.preferAddToBalance = event.params.preferAddToBalance;
  projectPayer.preferClaimedTokens = event.params.preferClaimedTokens;
  projectPayer.project = idForProject(event.params.projectId, pv);
  projectPayer.projectId = event.params.projectId.toI32();
  projectPayer.save();
}
