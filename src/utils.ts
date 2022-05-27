import {
  Address,
  BigInt,
  Bytes,
  ens,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { JBProjectHandles } from "../generated/JBProjectHandles/JBProjectHandles";

import { TerminalDirectory } from "../generated/Projects/TerminalDirectory";
import {
  Participant,
  Project,
  ProjectEvent,
  ProtocolLog,
  ProtocolV1Log,
  ProtocolV2Log,
} from "../generated/schema";
import {
  address_jbProjectHandles,
  address_terminalDirectory,
  address_terminalV1,
  address_terminalV1_1,
} from "./contractAddresses";
import { CV, ProjectEventKey } from "./types";

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

export function idForProjectTx(
  projectId: BigInt,
  cv: CV,
  event: ethereum.Event,
  useLogIndex: boolean = false // Using log index will ensure ID is unique even if event is emitted multiple times within a single tx
): string {
  return (
    idForProject(projectId, cv) +
    "-" +
    event.transaction.hash.toHexString() +
    (useLogIndex ? "-" + event.logIndex.toString() : "")
  );
}

function idForProjectEvent(
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
  return `${cv[0]}-${projectId.toString()}`;
}

export function updateBalance(participant: Participant): void {
  participant.balance = participant.unstakedBalance.plus(
    participant.stakedBalance
  );
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
  }

  projectEvent.save();
}

export function cvForV1Project(projectId: BigInt): CV {
  let terminal = TerminalDirectory.bind(
    Address.fromString(address_terminalDirectory)
  );
  let callResult = terminal.try_terminalOf(projectId);

  if (callResult.reverted) {
    log.error("terminalOf reverted, project: {}, terminalDirectory: {}", [
      projectId.toHexString(),
      address_terminalDirectory,
    ]);
    // 0 will always indicate an error
    return "0";
  } else {
    return cvForTerminal(callResult.value);
  }
}

export function cvForTerminal(terminal: Address): CV {
  let _terminal = terminal.toHexString().toLowerCase();

  // Switch statement throws unclear type error in graph compiler, so we use if statements instead
  if (_terminal == address_terminalV1.toLowerCase()) {
    return "1";
  }
  if (_terminal == address_terminalV1_1.toLowerCase()) {
    return "1.1";
  }
  log.error("Invalid terminal address {}", [_terminal]);
  // 0 will always indicate an error
  return "0";
}

export function updateV2ProjectHandle(projectId: BigInt): void {
  let jbProjectHandles = JBProjectHandles.bind(
    Address.fromString(address_jbProjectHandles)
  );
  let handleCallResult = jbProjectHandles.try_handleOf(projectId);
  if (handleCallResult.reverted) {
    log.error(
      "JBProjectHandles.handleOf reverted, projectId: {}, jbProjectHandles: {}",
      [projectId.toString(), address_jbProjectHandles]
    );
    return;
  }

  let cv = "2";
  let _projectId = idForProject(projectId, cv);
  let project = Project.load(_projectId);
  if (!project) {
    log.error("[handleSetReverseRecord] Missing project. ID:{}", [
      projectId.toString(),
    ]);
    return;
  }
  project.handle = handleCallResult.value;
  project.save();
}
