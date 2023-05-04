import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { Project, RedeemEvent } from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3RedeemTokens(
  event: ethereum.Event,
  projectId: BigInt,
  terminal: Bytes,
  tokenCount: BigInt,
  beneficiary: Address,
  reclaimedAmount: BigInt,
  reclaimedAmountUSD: BigInt | null,
  holder: Address,
  metadata: Bytes | null,
  memo: string | null,
  caller: Address
): void {
  const idOfProject = idForProject(projectId, pv);

  const redeemEvent = new RedeemEvent(
    idForProjectTx(projectId, pv, event, true)
  );

  redeemEvent.projectId = projectId.toI32();
  redeemEvent.pv = pv.toString();
  redeemEvent.terminal = terminal;
  redeemEvent.amount = tokenCount;
  redeemEvent.beneficiary = beneficiary;
  redeemEvent.caller = caller;
  redeemEvent.from = event.transaction.from;
  redeemEvent.holder = holder;
  redeemEvent.returnAmount = reclaimedAmount;
  redeemEvent.returnAmountUSD = reclaimedAmountUSD;
  redeemEvent.project = idOfProject;
  redeemEvent.timestamp = event.block.timestamp.toI32();
  redeemEvent.txHash = event.transaction.hash;
  redeemEvent.metadata = metadata;
  redeemEvent.memo = memo;
  redeemEvent.save();

  saveNewProjectTerminalEvent(
    event,
    projectId,
    redeemEvent.id,
    pv,
    ProjectEventKey.redeemEvent,
    terminal,
    caller
  );

  const project = Project.load(idOfProject);
  if (!project) {
    log.error("[handleV2V3RedeemTokens] Missing project. ID:{}", [idOfProject]);
    return;
  }
  project.redeemVolume = project.redeemVolume.plus(reclaimedAmount);
  if (reclaimedAmountUSD) {
    project.redeemVolumeUSD = project.redeemVolumeUSD.plus(
      reclaimedAmountUSD
    );
  }
  project.currentBalance = project.currentBalance.minus(reclaimedAmount);
  project.redeemCount = project.redeemCount + 1;
  project.save();
}
