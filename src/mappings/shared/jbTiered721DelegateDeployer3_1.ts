import { Address, DataSourceContext, log } from "@graphprotocol/graph-ts";

import { DelegateDeployed } from "../../../generated/JBTiered721DelegateDeployer3_1/JBTiered721DelegateDeployer3_1";
import { JB721Delegate3_1 as JB721Delegate3_1DataSource } from "../../../generated/templates";
import { JB721Delegate3_1 } from "../../../generated/templates/JB721Delegate3_1/JB721Delegate3_1";
import { PV } from "../../enums";
import { JB721DelegateCollection } from "../../../generated/schema";
import { idForProject } from "../../utils/ids";

const pv = PV.PV2;

/**
 * When a delegate is deployed, we create a new dataSource so we can
 * handle token transfers later.
 */
export function handleDelegateDeployed(event: DelegateDeployed): void {
  const address = event.params.newDelegate;

  const jbTiered721DelegateContext = new DataSourceContext();
  jbTiered721DelegateContext.setBigInt("projectId", event.params.projectId);
  jbTiered721DelegateContext.setString("pv", pv.toString());

  // Create a data source that will track token transfers
  JB721Delegate3_1DataSource.createWithContext(
    address,
    jbTiered721DelegateContext
  );

  const collection = new JB721DelegateCollection(address.toHexString());
  collection.projectId = event.params.projectId.toI32();
  collection.governanceType = event.params.governanceType;
  collection.project = idForProject(event.params.projectId, pv);

  const jb721DelegateContract = JB721Delegate3_1.bind(
    Address.fromBytes(address)
  );

  // Name
  const nameCall = jb721DelegateContract.try_name();
  if (nameCall.reverted) {
    log.error(
      "[jb721_v1:handleTransfer] name() reverted for jb721Delegate:{}",
      [address.toHexString()]
    );
    return;
  }
  collection.name = nameCall.value;

  // Symbol
  const symbolCall = jb721DelegateContract.try_symbol();
  if (symbolCall.reverted) {
    log.error(
      "[jb721_v1:handleTransfer] symbol() reverted for jb721Delegate:{}",
      [address.toHexString()]
    );
    return;
  }
  collection.symbol = symbolCall.value;

  collection.save();
}
