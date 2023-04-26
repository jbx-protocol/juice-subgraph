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

  project.volume = project.volume.plus(amount);
  if (amountUSD) project.volumeUSD = project.volumeUSD.plus(amountUSD);
  project.currentBalance = project.currentBalance.plus(amount);
  project.paymentsCount = project.paymentsCount + 1;

  // This is hacky, but the only way we can tell if this payment is a distribution
  const isDistribution =
    note.startsWith("Fee from @") || note.startsWith("Payout from @");

  if (pay) {
    pay.pv = pv.toString();
    pay.terminal = terminal;
    pay.projectId = projectId.toI32();
    pay.amount = amount;
    pay.amountUSD = amountUSD;
    pay.beneficiary = beneficiary;
    pay.caller = caller;
    pay.from = event.transaction.from;
    pay.project = idOfProject;
    pay.note = note;
    pay.timestamp = event.block.timestamp.toI32();
    pay.txHash = event.transaction.hash;
    pay.isDistribution = isDistribution;
    pay.save();

    saveNewProjectTerminalEvent(
      event,
      projectId,
      pay.id,
      pv,
      ProjectEventKey.payEvent,
      terminal,
      caller
    );

    handleTrendingPayment(event.block.timestamp);
  }

  if (!isDistribution) {
    const lastPaidTimestamp = event.block.timestamp.toI32();

    const participantId = idForParticipant(
      projectId,
      pv,
      event.transaction.from
    );

    let participant = Participant.load(participantId);

    // update contributorsCount
    if (!participant || participant.volume.isZero()) {
      project.contributorsCount = project.contributorsCount + 1;
    }

    if (!participant) {
      participant = newParticipant(pv, projectId, event.transaction.from);
    }
    participant.volume = participant.volume.plus(amount);
    if (amountUSD) {
      participant.volumeUSD = participant.volumeUSD.plus(amountUSD);
    }
    participant.lastPaidTimestamp = lastPaidTimestamp;
    participant.paymentsCount = participant.paymentsCount + 1;
    participant.save();

    // Update wallet, create if needed
    const walletId = toHexLowercase(event.transaction.from);
    let wallet = Wallet.load(walletId);
    if (!wallet) {
      wallet = newWallet(walletId);
    }
    wallet.volume = wallet.volume.plus(amount);
    if (amountUSD) {
      wallet.volumeUSD = wallet.volumeUSD.plus(amountUSD);
    }
    wallet.lastPaidTimestamp = lastPaidTimestamp;
    wallet.save();
  }

  project.save();
}
