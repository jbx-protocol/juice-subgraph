import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Participant,
  PayEvent,
  Project,
  Wallet,
} from "../../../../generated/schema";
import { ProjectEventKey, PV } from "../../../enums";
import { newParticipant, newWallet } from "../../entities/participant";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { toHexLowercase } from "../../format";
import { idForParticipant, idForPayEvent, idForProject } from "../../ids";
import { handleTrendingPayment } from "../../trending";

const pv = PV.PV1;

export function handleV1Pay(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  amountUSD: BigInt | null,
  terminal: Bytes,
  beneficiary: Address,
  note: string,
  caller: Address
): void {
  const pay = new PayEvent(idForPayEvent());
  const idOfProject = idForProject(projectId, pv);
  const project = Project.load(idOfProject);

  // Safety check: fail if project doesn't exist
  if (!project) {
    log.error("[handleV1Pay] Missing project. ID:{}", [idOfProject]);
    return;
  }

  project.totalPaid = project.totalPaid.plus(amount);
  if (amountUSD) project.totalPaidUSD = project.totalPaidUSD.plus(amountUSD);
  project.currentBalance = project.currentBalance.plus(amount);
  project.paymentsCount = project.paymentsCount + 1;
  project.save();

  if (pay) {
    pay.pv = pv.toString();
    pay.terminal = terminal;
    pay.projectId = projectId.toI32();
    pay.amount = amount;
    pay.amountUSD = amountUSD;
    pay.beneficiary = beneficiary;
    pay.caller = event.transaction.from;
    pay.project = idOfProject;
    pay.note = note;
    pay.timestamp = event.block.timestamp.toI32();
    pay.txHash = event.transaction.hash;
    pay.save();

    saveNewProjectTerminalEvent(
      event,
      projectId,
      pay.id,
      pv,
      ProjectEventKey.payEvent,
      caller,
      terminal
    );

    handleTrendingPayment(event.block.timestamp);
  }

  const lastPaidTimestamp = event.block.timestamp.toI32();

  const participantId = idForParticipant(projectId, pv, caller);
  let participant = Participant.load(participantId);
  if (!participant) {
    participant = newParticipant(pv, projectId, caller);
  }
  participant.totalPaid = participant.totalPaid.plus(amount);
  if (amountUSD) {
    participant.totalPaidUSD = participant.totalPaidUSD.plus(amountUSD);
  }
  participant.lastPaidTimestamp = lastPaidTimestamp;
  participant.save();

  // Update wallet, create if needed
  const walletId = toHexLowercase(caller);
  let wallet = Wallet.load(walletId);
  if (!wallet) {
    wallet = newWallet(walletId);
  }
  wallet.totalPaid = wallet.totalPaid.plus(amount);
  if (amountUSD) {
    wallet.totalPaidUSD = wallet.totalPaidUSD.plus(amountUSD);
  }
  wallet.lastPaidTimestamp = lastPaidTimestamp;
  wallet.save();
}
