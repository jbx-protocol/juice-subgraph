import { DataSourceContext } from "@graphprotocol/graph-ts";

import { DeployProjectPayer } from "../../../generated/JBETHERC20ProjectPayerDeployer/JBETHERC20ProjectPayerDeployer";
import { ETHERC20ProjectPayer } from "../../../generated/schema";
import { JBETHERC20ProjectPayer } from "../../../generated/templates";
import { CV } from "../../types";
import { idForProject } from "../../utils";

const cv: CV = "2";

export function handleDeployProjectPayer(event: DeployProjectPayer): void {
  // Create dataSource context
  let projectPayerContext = new DataSourceContext();
  projectPayerContext.setBytes("address", event.params.projectPayer);
  JBETHERC20ProjectPayer.createWithContext(
    event.params.projectPayer,
    projectPayerContext
  );

  // Create entity
  let projectPayer = new ETHERC20ProjectPayer(
    event.params.projectPayer.toHexString()
  );
  projectPayer.address = event.params.projectPayer;
  projectPayer.beneficiary = event.params.defaultBeneficiary;
  projectPayer.directory = event.params.directory;
  projectPayer.memo = event.params.defaultMemo;
  projectPayer.metadata = event.params.defaultMetadata;
  projectPayer.owner = event.params.owner;
  projectPayer.preferAddToBalance = event.params.preferAddToBalance;
  projectPayer.preferClaimedTokens = event.params.defaultPreferClaimedTokens;
  projectPayer.project = idForProject(event.params.defaultProjectId, cv);
  projectPayer.projectId = event.params.defaultProjectId.toI32();
  projectPayer.save();
}
