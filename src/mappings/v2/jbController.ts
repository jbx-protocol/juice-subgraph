import {
  DistributeReservedTokens,
  DistributeToReservedTokenSplit,
  LaunchProject,
  MintTokens,
  ReconfigureFundingCycles,
  SetFundAccessConstraints,
} from "../../../generated/V2JBController/JBController";
import { handleV2V3DistributeReservedTokens } from "../../utils/v2v3/controller/distributeReservedTokens";
import { handleV2V3DistributeReservedTokenSplit } from "../../utils/v2v3/controller/distributeReservedTokenSplit";
import { handleV2V3LaunchProject } from "../../utils/v2v3/controller/launchProject";
import { handleV2V3MintTokens } from "../../utils/v2v3/controller/mintTokens";
import { handleV2V3ReconfigureFundingCycles } from "../../utils/v2v3/controller/reconfigureFundingCycles";
import { handleV2V3SetFundAccessConstraints } from "../../utils/v2v3/controller/setFundAccessConstraints";

export function handleMintTokens(event: MintTokens): void {
  handleV2V3MintTokens(
    event,
    event.params.projectId,
    event.params.tokenCount,
    event.params.beneficiary,
    event.params.caller,
    event.params.memo
  );
}

export function handleDistributeReservedTokens(
  event: DistributeReservedTokens
): void {
  handleV2V3DistributeReservedTokens(
    event,
    event.params.projectId,
    event.params.fundingCycleNumber,
    event.params.beneficiary,
    event.params.tokenCount,
    event.params.beneficiaryTokenCount,
    event.params.memo,
    event.params.caller
  );
}

export function handleDistributeToReservedTokenSplit(
  event: DistributeToReservedTokenSplit
): void {
  handleV2V3DistributeReservedTokenSplit(
    event,
    event.params.projectId,
    event.params.tokenCount,
    event.params.split,
    event.params.caller
  );
}

export function handleLaunchProject(event: LaunchProject): void {
  handleV2V3LaunchProject(event.params.projectId, event.params.caller);
}

export function handleReconfigureFundingCycles(
  event: ReconfigureFundingCycles
): void {
  handleV2V3ReconfigureFundingCycles(
    event,
    event.params.projectId,
    event.params.memo
  );
}

export function handleSetFundAccessConstraints(
  event: SetFundAccessConstraints
): void {
  handleV2V3SetFundAccessConstraints(
    event,
    event.params.projectId,
    event.params.caller,
    event.params.constraints,
    event.params.fundingCycleConfiguration,
    event.params.fundingCycleNumber
  );
}
