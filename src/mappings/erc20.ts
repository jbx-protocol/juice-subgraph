import { BigInt, dataSource } from "@graphprotocol/graph-ts";

import { Transfer } from "../../generated/templates/ERC20/ERC20";
import { handleProjectERC20Transfer } from "../utils";

export function handleTransfer(event: Transfer): void {
  let context = dataSource.context();
  let projectId = context.getI32("projectId");
  let cv = context.getI32("cv");

  handleProjectERC20Transfer(BigInt.fromI32(projectId), event, cv);
}
