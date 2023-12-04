import { BigInt, log } from "@graphprotocol/graph-ts";

import { PayEvent } from "../../../../generated/schema";
import { idForPrevPayEvent } from "../../ids";

export function handleV2V3ProcessFee(projectId: BigInt): void {
  const id = idForPrevPayEvent();
  const pay = PayEvent.loadInBlock(id);
  if (!pay) {
    log.error("[handleV2V3ProcessFee] Missing PayEvent. ID:{}", [id]);
    return;
  }
  // Sanity check to ensure pay event was to juicebox project
  if (pay.projectId != 1) return;
  pay.feeFromV2Project = projectId.toI32();
  pay.save();
}
