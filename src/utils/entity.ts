import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { JBProjectHandles } from "../../generated/JBProjectHandles/JBProjectHandles";
import {
  Participant,
  Project,
  ProjectEvent,
  ProtocolLog,
  ProtocolV1Log,
  ProtocolV2Log,
  ProtocolV3Log,
} from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";
import { address_shared_jbProjectHandles } from "../contractAddresses";
import { CV, ProjectEventKey } from "../types";
import { idForParticipant, idForProject, idForProjectEvent } from "./ids";

export function updateProtocolEntity(): void {
  const protocol = ProtocolLog.load(PROTOCOL_ID);
  const protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  const protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);

  if (protocol && protocolV1Log) {
    protocol.erc20Count =
      protocolV1Log.erc20Count + (protocolV2Log ? protocolV2Log.erc20Count : 0);
    protocol.paymentsCount =
      protocolV1Log.paymentsCount +
      (protocolV2Log ? protocolV2Log.paymentsCount : 0);
    protocol.projectsCount =
      protocolV1Log.projectsCount +
      (protocolV2Log ? protocolV2Log.projectsCount : 0);
    protocol.redeemCount =
      protocolV1Log.redeemCount +
      (protocolV2Log ? protocolV2Log.redeemCount : 0);
    protocol.volumePaid = protocolV2Log
      ? protocolV1Log.volumePaid.plus(protocolV2Log.volumePaid)
      : protocolV1Log.volumePaid;
    protocol.volumeRedeemed = protocolV2Log
      ? protocolV1Log.volumeRedeemed.plus(protocolV2Log.volumePaid)
      : protocolV1Log.volumeRedeemed;
    protocol.save();
  }
}

export function saveNewProjectEvent(
  event: ethereum.Event,
  projectId: BigInt,
  id: string,
  cv: CV,
  key: ProjectEventKey
): void {
  let projectEvent = new ProjectEvent(
    idForProjectEvent(
      projectId,
      cv,
      event.transaction.hash,
      event.transactionLogIndex
    )
  );
  if (!projectEvent) return;
  projectEvent.cv = cv;
  projectEvent.projectId = projectId.toI32();
  projectEvent.timestamp = event.block.timestamp.toI32();
  projectEvent.project = idForProject(projectId, cv);

  switch (key) {
    case ProjectEventKey.deployedERC20Event:
      projectEvent.deployedERC20Event = id;
      break;
    case ProjectEventKey.distributePayoutsEvent:
      projectEvent.distributePayoutsEvent = id;
      break;
    case ProjectEventKey.distributeReservedTokensEvent:
      projectEvent.distributeReservedTokensEvent = id;
      break;
    case ProjectEventKey.distributeToPayoutModEvent:
      projectEvent.distributeToPayoutModEvent = id;
      break;
    case ProjectEventKey.distributeToReservedTokenSplitEvent:
      projectEvent.distributeToReservedTokenSplitEvent = id;
      break;
    case ProjectEventKey.distributeToTicketModEvent:
      projectEvent.distributeToTicketModEvent = id;
      break;
    case ProjectEventKey.mintTokensEvent:
      projectEvent.mintTokensEvent = id;
      break;
    case ProjectEventKey.payEvent:
      projectEvent.payEvent = id;
      break;
    case ProjectEventKey.addToBalanceEvent:
      projectEvent.addToBalanceEvent = id;
      break;
    case ProjectEventKey.printReservesEvent:
      projectEvent.printReservesEvent = id;
      break;
    case ProjectEventKey.projectCreateEvent:
      projectEvent.projectCreateEvent = id;
      break;
    case ProjectEventKey.redeemEvent:
      projectEvent.redeemEvent = id;
      break;
    case ProjectEventKey.tapEvent:
      projectEvent.tapEvent = id;
      break;
    case ProjectEventKey.useAllowanceEvent:
      projectEvent.useAllowanceEvent = id;
      break;
    case ProjectEventKey.deployETHERC20ProjectPayerEvent:
      projectEvent.deployETHERC20ProjectPayerEvent = id;
      break;
    case ProjectEventKey.deployVeNftEvent:
      projectEvent.deployVeNftEvent = id;
      break;
  }

  projectEvent.save();
}

export function newProtocolLog(): ProtocolLog {
  const protocolLog = new ProtocolLog(PROTOCOL_ID);
  protocolLog.projectsCount = 0;
  protocolLog.volumePaid = BigInt.fromString("0");
  protocolLog.volumeRedeemed = BigInt.fromString("0");
  protocolLog.paymentsCount = 0;
  protocolLog.redeemCount = 0;
  protocolLog.erc20Count = 0;
  protocolLog.trendingLastUpdatedTimestamp = 0;
  return protocolLog;
}

export function newProtocolV1Log(): ProtocolV1Log {
  const protocolV1Log = new ProtocolV1Log(PROTOCOL_ID);
  protocolV1Log.log = PROTOCOL_ID;
  protocolV1Log.projectsCount = 0;
  protocolV1Log.volumePaid = BigInt.fromString("0");
  protocolV1Log.volumeRedeemed = BigInt.fromString("0");
  protocolV1Log.paymentsCount = 0;
  protocolV1Log.redeemCount = 0;
  protocolV1Log.erc20Count = 0;
  return protocolV1Log;
}

export function newProtocolV2Log(): ProtocolV2Log {
  const protocolV2Log = new ProtocolV2Log(PROTOCOL_ID);
  protocolV2Log.log = PROTOCOL_ID;
  protocolV2Log.projectsCount = 0;
  protocolV2Log.volumePaid = BigInt.fromString("0");
  protocolV2Log.volumeRedeemed = BigInt.fromString("0");
  protocolV2Log.paymentsCount = 0;
  protocolV2Log.redeemCount = 0;
  protocolV2Log.erc20Count = 0;
  return protocolV2Log;
}

export function newProtocolV3Log(): ProtocolV3Log {
  const protocolV3Log = new ProtocolV3Log(PROTOCOL_ID);
  protocolV3Log.log = PROTOCOL_ID;
  protocolV3Log.projectsCount = 0;
  protocolV3Log.volumePaid = BigInt.fromString("0");
  protocolV3Log.volumeRedeemed = BigInt.fromString("0");
  protocolV3Log.paymentsCount = 0;
  protocolV3Log.redeemCount = 0;
  protocolV3Log.erc20Count = 0;
  return protocolV3Log;
}

export function newParticipant(
  cv: CV,
  projectId: BigInt,
  wallet: Bytes
): Participant {
  const participant = new Participant(idForParticipant(projectId, cv, wallet));
  participant.cv = cv;
  participant.projectId = projectId.toI32();
  participant.project = idForProject(projectId, cv);
  participant.wallet = wallet;
  participant.balance = BigInt.fromString("0");
  participant.stakedBalance = BigInt.fromString("0");
  participant.unstakedBalance = BigInt.fromString("0");
  participant.totalPaid = BigInt.fromString("0");
  participant.lastPaidTimestamp = 0;
  return participant;
}

export function updateParticipantBalance(participant: Participant): void {
  participant.balance = participant.unstakedBalance.plus(
    participant.stakedBalance
  );
}

export function updateV2ProjectHandle(projectId: BigInt): void {
  if (!address_shared_jbProjectHandles) return;

  const jbProjectHandles = JBProjectHandles.bind(
    Address.fromString(address_shared_jbProjectHandles!)
  );
  const handleCallResult = jbProjectHandles.try_handleOf(projectId);
  let cv = "2";
  let project = Project.load(idForProject(projectId, cv));
  if (!project) {
    log.error("[handleSetReverseRecord] Missing project. ID:{}", [
      projectId.toString(),
    ]);
    return;
  }

  if (handleCallResult.reverted) {
    project.handle = null;
  } else {
    project.handle = handleCallResult.value;
  }

  project.save();
}
