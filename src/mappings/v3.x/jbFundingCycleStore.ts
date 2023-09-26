import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Configure,
  Init,
  JBFundingCycleStore3,
} from "../../../generated/JBFundingCycleStore3/JBFundingCycleStore3";
import { address_v3_jbFundingCycleStore } from "../../contractAddresses";
import { handleV2V3Configure } from "../../utils/v2v3/fundingCycleStore/configure";
import { handleV2V3Init } from "../../utils/v2v3/fundingCycleStore/init";

export function handleConfigure(event: Configure): void {
  if (!address_v3_jbFundingCycleStore) {
    log.error(
      "[jbFundingCycleStore_v3:handleConfigure] missing address_v3_jbFundingCycleStore",
      []
    );
    return;
  }
  const fcStore = JBFundingCycleStore3.bind(
    Address.fromBytes(Bytes.fromHexString(address_v3_jbFundingCycleStore!))
  );

  const getCall = fcStore.try_get(
    event.params.projectId,
    event.params.configuration
  );

  if (getCall.reverted) {
    log.error(
      "[jbFundingCycleStore_v3:handleConfigure] get() reverted for project {}, configuration {}",
      [
        event.params.projectId.toString(),
        event.params.configuration.toHexString(),
      ]
    );
  }

  handleV2V3Configure(
    event,
    event.params.projectId,
    event.params.data.duration,
    event.params.data.weight,
    getCall.value.weight,
    event.params.data.discountRate,
    event.params.data.ballot,
    event.params.mustStartAtOrAfter,
    getCall.value.start,
    event.params.configuration,
    event.params.metadata,
    getCall.value.number,
    getCall.value.basedOn,
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
