import {
  DeployETHERC20ProjectPayerEvent,
  ETHERC20ProjectPayer,
} from "../../../generated/schema";
import { JBETHERC20ProjectPayer } from "../../../generated/templates";
import { DeployProjectPayer } from "../../../generated/V3JBETHERC20ProjectPayerDeployer/JBETHERC20ProjectPayerDeployer";
import { ProjectEventKey, Version } from "../../types";
import { saveNewProjectEvent } from "../../utils/entity";
import { toHexLowercase } from "../../utils/format";
import { idForProject } from "../../utils/ids";

const pv: Version = "3";

export function handleDeployProjectPayer(event: DeployProjectPayer): void {
  JBETHERC20ProjectPayer.create(event.params.projectPayer);

  // Create entity
  const projectPayer = new ETHERC20ProjectPayer(
    toHexLowercase(event.params.projectPayer)
  );
  if (!projectPayer) return;
  projectPayer.address = event.params.projectPayer;
  projectPayer.beneficiary = event.params.defaultBeneficiary;
  projectPayer.directory = event.params.directory;
  projectPayer.memo = event.params.defaultMemo;
  projectPayer.metadata = event.params.defaultMetadata;
  projectPayer.owner = event.params.owner;
  projectPayer.preferAddToBalance = event.params.preferAddToBalance;
  projectPayer.preferClaimedTokens = event.params.defaultPreferClaimedTokens;
  projectPayer.project = idForProject(event.params.defaultProjectId, pv);
  projectPayer.projectId = event.params.defaultProjectId.toI32();
  projectPayer.save();

  const deployProjectPayerEvent = new DeployETHERC20ProjectPayerEvent(
    toHexLowercase(projectPayer.address)
  );
  if (!deployProjectPayerEvent) return;
  deployProjectPayerEvent.address = projectPayer.address;
  deployProjectPayerEvent.beneficiary = projectPayer.beneficiary;
  deployProjectPayerEvent.directory = projectPayer.directory;
  deployProjectPayerEvent.memo = projectPayer.memo;
  deployProjectPayerEvent.metadata = projectPayer.metadata;
  deployProjectPayerEvent.owner = projectPayer.owner;
  deployProjectPayerEvent.preferAddToBalance = projectPayer.preferAddToBalance;
  deployProjectPayerEvent.preferClaimedTokens =
    projectPayer.preferClaimedTokens;
  deployProjectPayerEvent.projectId = projectPayer.projectId;
  deployProjectPayerEvent.project = projectPayer.project;
  deployProjectPayerEvent.timestamp = event.block.timestamp.toI32();
  deployProjectPayerEvent.txHash = event.transaction.hash;
  deployProjectPayerEvent.caller = event.params.caller;
  deployProjectPayerEvent.save();

  saveNewProjectEvent(
    event,
    event.params.defaultProjectId,
    deployProjectPayerEvent.id,
    pv,
    ProjectEventKey.deployETHERC20ProjectPayerEvent
  );
}
