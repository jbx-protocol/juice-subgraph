import { BigInt, dataSource } from "@graphprotocol/graph-ts";

import { Transfer } from "../../../generated/templates/ERC20/ERC20";
import { handleProjectERC20Transfer } from "../../utils";

export function handleV2Transfer(event: Transfer): void {
  let context = dataSource.context();
  let projectId = context.getString("projectId");

  handleProjectERC20Transfer(BigInt.fromString(projectId), event);
}
