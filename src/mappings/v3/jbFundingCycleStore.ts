import {
  Configure,
  Init,
} from "../../../generated/V3JBFundingCycleStore/JBFundingCycleStore";
import { handleV2V3Configure } from "../../utils/v2v3/fundingCycleStore/configure";
import { handleV2V3Init } from "../../utils/v2v3/fundingCycleStore/init";

export function handleConfigure(event: Configure): void {
  handleV2V3Configure(
    event,
    event.params.projectId,
    event.params.data,
    event.params.mustStartAtOrAfter,
    event.params.configuration,
    event.params.metadata,
    event.params.caller
  );
}

export function handleInit(event: Init): void {
  handleV2V3Init(
    event,
    event.params.projectId,
    event.params.configuration,
    event.params.basedOn
  );
}
