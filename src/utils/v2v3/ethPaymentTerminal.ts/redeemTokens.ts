import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Project,
  ProtocolV2Log,
  RedeemEvent,
} from "../../../../generated/schema";
import { PROTOCOL_ID } from "../../../constants";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import {
  newProtocolV2Log,
  updateProtocolEntity,
} from "../../entities/protocolLog";
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
  redeemEvent.caller = event.transaction.from;
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
    caller,
    terminal
  );

  const project = Project.load(idOfProject);
  if (!project) {
    log.error("[handleV2V3RedeemTokens] Missing project. ID:{}", [idOfProject]);
    return;
  }
  project.totalRedeemed = project.totalRedeemed.plus(reclaimedAmount);
  if (reclaimedAmountUSD) {
    project.totalRedeemedUSD = project.totalRedeemedUSD.plus(
      reclaimedAmountUSD
    );
  }
  project.currentBalance = project.currentBalance.minus(reclaimedAmount);
  project.redeemCount = project.redeemCount + 1;
  project.save();
}
