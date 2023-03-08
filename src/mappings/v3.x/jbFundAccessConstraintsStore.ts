import { SetFundAccessConstraints } from "../../../generated/JBFundAccessConstraintsStore/JBFundAccessConstraintsStore";
import { handleV2V3SetFundAccessConstraints } from "../../utils/v2v3/fundAccessConstraints/setFundAccessConstraints";

export function handleSetFundAccessConstraints(
  event: SetFundAccessConstraints
): void {
  handleV2V3SetFundAccessConstraints(
    event,
    event.params.projectId,
    event.params.caller,
    event.params.constraints.distributionLimit,
    event.params.constraints.distributionLimitCurrency,
    event.params.constraints.overflowAllowance,
    event.params.constraints.overflowAllowanceCurrency,
    event.params.constraints.terminal,
    event.params.constraints.token,
    event.params.fundingCycleConfiguration,
  );
}
