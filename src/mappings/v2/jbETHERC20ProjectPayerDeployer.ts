import { DeployProjectPayer } from "../../../generated/JBETHERC20ProjectPayerDeployer2/JBETHERC20ProjectPayerDeployer2";
import { handleV2V3DeployProjectPayer } from "../../utils/v2v3/ethERC20ProjectPayerDeployer.ts/deployProjectPayer";

export function handleDeployProjectPayer(event: DeployProjectPayer): void {
  handleV2V3DeployProjectPayer(
    event,
    event.params.projectPayer,
    event.params.defaultBeneficiary,
    event.params.defaultMemo,
    event.params.directory,
    event.params.defaultMetadata,
    event.params.owner,
    event.params.preferAddToBalance,
    event.params.defaultPreferClaimedTokens,
    event.params.defaultProjectId,
    event.params.caller
  );
}
