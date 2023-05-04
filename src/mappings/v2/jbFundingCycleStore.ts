import {
  Configure,
  Init,
} from "../../../generated/JBFundingCycleStore2/JBFundingCycleStore2";
import { handleV2V3Configure } from "../../utils/v2v3/fundingCycleStore/configure";
import { handleV2V3Init } from "../../utils/v2v3/fundingCycleStore/init";

export function handleConfigure(event: Configure): void {
  handleV2V3Configure(
    event,
    event.params.projectId,
    event.params.data.duration,
    event.params.data.weight,
    event.params.data.discountRate,
    event.params.data.ballot,
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
    event.params.basedOn,
  );
}
