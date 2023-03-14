import {
  DistributeReservedTokens,
  DistributeToReservedTokenSplit,
  LaunchProject,
  MintTokens,
  ReconfigureFundingCycles,
} from "../../../generated/JBController3_1/JBController3_1";
import { handleV2V3DistributeReservedTokens } from "../../utils/v2v3/controller/distributeReservedTokens";
import { handleV2V3DistributeReservedTokenSplit } from "../../utils/v2v3/controller/distributeReservedTokenSplit";
import { handleV2V3LaunchProject } from "../../utils/v2v3/controller/launchProject";
import { handleV2V3MintTokens } from "../../utils/v2v3/controller/mintTokens";
import { handleV2V3ReconfigureFundingCycles } from "../../utils/v2v3/controller/reconfigureFundingCycles";

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
    event.params.split.allocator,
    event.params.split.beneficiary,
    event.params.split.lockedUntil,
    event.params.split.percent,
    event.params.split.preferClaimed,
    event.params.split.projectId,
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
