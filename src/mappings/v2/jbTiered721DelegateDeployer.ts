import { DelegateDeployed } from "../../../generated/JBTiered721DelegateDeployer/JBTiered721DelegateDeployer";
import { JB721Delegate } from "../../../generated/schema";
import { DataSourceContext, log } from "@graphprotocol/graph-ts";
import { idForProject } from "../../utils/ids";
import { CV } from "../../types";
import { JBTiered721Delegate as JBTiered721DelegateTemplate } from "../../../generated/templates";
import { JBTiered721Delegate } from "../../../generated/templates/JBTiered721Delegate/JBTiered721Delegate";

const cv: CV = "2";

export function handleDelegateDeployed(event: DelegateDeployed): void {
  const address = event.params.newDelegate;

  // Create context
  const jbTiered721DelegateContext = new DataSourceContext();
  jbTiered721DelegateContext.setBytes("address", address);
  JBTiered721DelegateTemplate.createWithContext(
    address,
    jbTiered721DelegateContext
  );

  // Create entity
  let delegate = new JB721Delegate(address.toHexString().toLowerCase());

  const contract = JBTiered721Delegate.bind(address);

  const directoryCall = contract.try_directory();
  if (directoryCall.reverted) {
    log.error("[handleDelegateDeployed] directory() reverted for delegate:{}", [
      address.toHexString(),
    ]);
    return;
  }
  delegate.directory = directoryCall.value;

  const nameCall = contract.try_name();
  if (nameCall.reverted) {
    log.error("[handleDelegateDeployed] name() reverted for delegate:{}", [
      address.toHexString(),
    ]);
    return;
  }
  delegate.name = nameCall.value;

  const symbolCall = contract.try_symbol();
  if (symbolCall.reverted) {
    log.error("[handleDelegateDeployed] symbol() reverted for delegate:{}", [
      address.toHexString(),
    ]);
    return;
  }
  delegate.symbol = symbolCall.value;

  delegate.projectId = event.params.projectId.toI32();
  delegate.project = idForProject(event.params.projectId, cv);

  delegate.save();
}
