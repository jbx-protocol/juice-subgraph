import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  Participant,
  PayEvent,
  Project,
  Wallet,
} from "../../../../generated/schema";
import {
  address_v1_terminalV1,
  address_v1_terminalV1_1,
  address_v2_jbETHPaymentTerminal,
  address_v3_jbETHPaymentTerminal,
  address_v3_jbETHPaymentTerminal3_1,
} from "../../../contractAddresses";
import { ProjectEventKey, PV } from "../../../enums";
import { newParticipant, newWallet } from "../../entities/participant";
import { saveNewProjectTerminalEvent } from "../../entities/projectEvent";
import { toHexLowercase } from "../../format";
import { idForParticipant, idForPayEvent, idForProject } from "../../ids";
import { handleTrendingPayment } from "../../trending";

const pv = PV.PV2;

export function handleV2V3Pay(
  event: ethereum.Event,
  projectId: BigInt,
  amount: BigInt,
  amountUSD: BigInt | null,
  terminal: Bytes,
  beneficiary: Address,
  caller: Address,
  payer: Address,
  memo: string
): void {
  const idOfProject = idForProject(projectId, pv);
  const project = Project.load(idOfProject);

  if (!project) {
    log.error("[handleV2V3Pay] Missing project. ID:{}", [idOfProject]);
    return;
  }

  project.volume = project.volume.plus(amount);
  project.currentBalance = project.currentBalance.plus(amount);
  project.paymentsCount = project.paymentsCount + 1;

  // For distribute events, caller will be a terminal
  const isDistribution = isTerminalAddress(caller);

  const pay = new PayEvent(idForPayEvent());
  pay.pv = pv.toString();
  pay.terminal = terminal;
  pay.projectId = projectId.toI32();
  pay.amount = amount;
  pay.amountUSD = amountUSD;
  pay.beneficiary = beneficiary;
  pay.caller = caller;
  pay.from = event.transaction.from;
  pay.project = idOfProject;
  pay.note = memo;
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

  if (!isDistribution) {
    const lastPaidTimestamp = event.block.timestamp.toI32();

    const participantId = idForParticipant(projectId, pv, payer);

    let participant = Participant.load(participantId);

    // update contributorsCount
    if (!participant || participant.volume.isZero()) {
      project.contributorsCount = project.contributorsCount + 1;
    }

    if (!participant) {
      participant = newParticipant(pv, projectId, payer);
    }

    participant.volume = participant.volume.plus(amount);
    if (amountUSD) {
      participant.volumeUSD = participant.volumeUSD.plus(amountUSD);
    }
    participant.lastPaidTimestamp = lastPaidTimestamp;
    participant.paymentsCount = participant.paymentsCount + 1;
    participant.save();

    // Update wallet, create if needed
    const walletId = toHexLowercase(payer);
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

function addrEquals(addr: Address, b: string | null): boolean {
  if (!b) return false;
  return addr == ByteArray.fromHexString(b!);
}

function isTerminalAddress(addr: Address): boolean {
  return (
    addrEquals(addr, address_v1_terminalV1) ||
    addrEquals(addr, address_v1_terminalV1_1) ||
    addrEquals(addr, address_v2_jbETHPaymentTerminal) ||
    addrEquals(addr, address_v3_jbETHPaymentTerminal) ||
    addrEquals(addr, address_v3_jbETHPaymentTerminal3_1)
  );
}
