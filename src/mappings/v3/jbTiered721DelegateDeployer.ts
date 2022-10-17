import { DataSourceContext } from "@graphprotocol/graph-ts";

import { DelegateDeployed } from "../../../generated/JBTiered721DelegateDeployer/JBTiered721DelegateDeployer";
import { JB721DelegateToken as JB721DelegateTokenTemplate } from "../../../generated/templates";
import { cvForV2_V3Project } from "../../utils/cv";

export function handleDelegateDeployed(event: DelegateDeployed): void {
  const cv = cvForV2_V3Project(event.params.projectId);

  const address = event.params.newDelegate;

  // Create context so we can track token transfers
  const jbTiered721DelegateContext = new DataSourceContext();
  jbTiered721DelegateContext.setBigInt("projectId", event.params.projectId);
  jbTiered721DelegateContext.setBytes("address", address);
  jbTiered721DelegateContext.setString("cv", cv);
  JB721DelegateTokenTemplate.createWithContext(
    address,
    jbTiered721DelegateContext
  );
}
