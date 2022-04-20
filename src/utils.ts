import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  Participant,
  Project,
  ProjectEvent,
  ProtocolLog,
  ProtocolV1Log,
  ProtocolV2Log,
} from "../generated/schema";
import { Transfer } from "../generated/templates/ERC20/ERC20";
import { indexedERC20s } from "./erc20/v1.x/indexedERC20s";
import { CV } from "./types";

export const protocolId = "1";

export function updateProtocolEntity(): void {
  const protocol = ProtocolLog.load(protocolId);
  const protocolV1Log = ProtocolV1Log.load(protocolId);
  const protocolV2Log = ProtocolV2Log.load(protocolId);

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

export function idForProjectEvent(
  projectId: BigInt,
  cv: CV,
  txHash: Bytes,
  logIndex: BigInt
): string {
  return `${idForProject(
    projectId,
    cv
  )}-${txHash.toHexString().toLowerCase()}-${logIndex.toString()}`;
}

export function idForParticipant(
  projectId: BigInt,
  cv: CV,
  walletAddress: Bytes
): string {
  return `${idForProject(
    projectId,
    cv
  )}-${walletAddress.toHexString().toLowerCase()}`;
}

export function idForProject(projectId: BigInt, cv: CV): string {
  return `${cv.toString().split(".")[0]}-${projectId.toString()}`;
}

export function erc20IsIndexed(projectId: BigInt): boolean {
  return indexedERC20s.includes(projectId.toString());
}

export function updateBalance(participant: Participant): void {
  participant.balance = participant.unstakedBalance.plus(
    participant.stakedBalance
  );
}

export function handleProjectERC20Transfer(
  projectId: BigInt,
  event: Transfer
): void {
  let sender = Participant.load(
    idForParticipant(projectId, 1, event.params.from)
  );
  let project = Project.load(idForProject(projectId, 1));

  if (!project) return;

  if (sender) {
    sender.unstakedBalance = sender.unstakedBalance.minus(event.params.value);

    updateBalance(sender);

    sender.save();
  }

  let receiverId = idForParticipant(projectId, 1, event.params.to);
  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = project.id;
    receiver.wallet = event.params.to;
    receiver.stakedBalance = BigInt.fromString("0");
    receiver.unstakedBalance = BigInt.fromString("0");
    receiver.totalPaid = BigInt.fromString("0");
    receiver.lastPaidTimestamp = BigInt.fromString("0");
  }

  if (!receiver) return;

  receiver.unstakedBalance = receiver.unstakedBalance.plus(event.params.value);

  updateBalance(receiver);

  receiver.save();
}

// TODO should be able to use this type for `key` argument in `saveNewProjectEvent` below. But Graph compiler does not like it.
// type ProjectEventKey = keyof Pick<
//   ProjectEvent,
//   | "deployedERC20Event"
//   | "distributeReservedTokensEvent"
//   | "distributeToPayoutModEvent"
//   | "distributeToReservedTokenSplitEvent"
//   | "distributeToTicketModEvent"
//   | "mintTokensEvent"
//   | "payEvent"
//   | "printReservesEvent"
//   | "projectCreateEvent"
//   | "tapEvent"
//   | "distributePayoutsEvent"
//   | "redeemEvent"
//   | "useAllowanceEvent"
// >;

export enum ProjectEventKey {
  deployedERC20Event,
  distributeReservedTokensEvent,
  distributeToPayoutModEvent,
  distributeToReservedTokenSplitEvent,
  distributeToTicketModEvent,
  mintTokensEvent,
  payEvent,
  printReservesEvent,
  projectCreateEvent,
  tapEvent,
  distributePayoutsEvent,
  redeemEvent,
  useAllowanceEvent,
}

export function saveNewProjectEvent(
  event: ethereum.Event,
  projectId: BigInt,
  id: string,
  cv: CV,
  key: ProjectEventKey // TODO see ProjectEventKey type above
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
  projectEvent.timestamp = event.block.timestamp;
  projectEvent.project = idForProject(projectId, cv);

  // Do this annoying dance because graph compiler is needy with setter types
  if (key === ProjectEventKey.deployedERC20Event)
    projectEvent.deployedERC20Event = id;
  else if (key === ProjectEventKey.distributePayoutsEvent)
    projectEvent.distributePayoutsEvent = id;
  else if (key === ProjectEventKey.distributeReservedTokensEvent)
    projectEvent.distributeReservedTokensEvent = id;
  else if (key === ProjectEventKey.distributeToPayoutModEvent)
    projectEvent.distributeToPayoutModEvent = id;
  else if (key === ProjectEventKey.distributeToReservedTokenSplitEvent)
    projectEvent.distributeToReservedTokenSplitEvent = id;
  else if (key === ProjectEventKey.distributeToTicketModEvent)
    projectEvent.distributeToTicketModEvent = id;
  else if (key === ProjectEventKey.mintTokensEvent)
    projectEvent.mintTokensEvent = id;
  else if (key === ProjectEventKey.payEvent) projectEvent.payEvent = id;
  else if (key === ProjectEventKey.printReservesEvent)
    projectEvent.printReservesEvent = id;
  else if (key === ProjectEventKey.projectCreateEvent)
    projectEvent.projectCreateEvent = id;
  else if (key === ProjectEventKey.redeemEvent) projectEvent.redeemEvent = id;
  else if (key === ProjectEventKey.tapEvent) projectEvent.tapEvent = id;
  else if (key === ProjectEventKey.useAllowanceEvent)
    projectEvent.useAllowanceEvent = id;

  projectEvent.save();
}
