import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { JBProjectHandles } from "../../generated/JBProjectHandles/JBProjectHandles";
import {
  ConfigureEvent,
  Participant,
  Project,
  ProjectEvent,
  ProtocolLog,
  ProtocolV1Log,
  ProtocolV2Log,
  ProtocolV3Log,
} from "../../generated/schema";
import {
  BITS_16,
  BITS_160_HEX,
  BITS_8,
  MAX_REDEMPTION_RATE,
  PROTOCOL_ID,
} from "../constants";
import {
  address_shared_jbProjectHandles,
  address_shared_legacy_jbProjectHandles,
} from "../contractAddresses";
import { startBlock_shared_jbProjectHandles } from "../startBlocks";
import { ProjectEventKey, Version } from "../types";
import {
  idForParticipant,
  idForProject,
  idForProjectEvent,
  idForProjectTx,
} from "./ids";

export function updateProtocolEntity(): void {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);

  if (!protocolLog) {
    log.error("[updateProtocolEntity] Failed to load protocolLog. ID:{}", [
      PROTOCOL_ID,
    ]);
    return;
  }

  let projectsCount = 0;
  let volumePaid = BigInt.fromString("0");
  let volumeRedeemed = BigInt.fromString("0");
  let paymentsCount = 0;
  let redeemCount = 0;
  let erc20Count = 0;

  const protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (protocolV1Log) {
    erc20Count = erc20Count + protocolV1Log.erc20Count;
    paymentsCount = paymentsCount + protocolV1Log.paymentsCount;
    projectsCount = projectsCount + protocolV1Log.projectsCount;
    redeemCount = redeemCount + protocolV1Log.redeemCount;
    volumePaid = volumePaid.plus(protocolV1Log.volumePaid);
    volumeRedeemed = volumeRedeemed.plus(protocolV1Log.volumeRedeemed);
  }

  const protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (protocolV2Log) {
    erc20Count = erc20Count + protocolV2Log.erc20Count;
    paymentsCount = paymentsCount + protocolV2Log.paymentsCount;
    projectsCount = projectsCount + protocolV2Log.projectsCount;
    redeemCount = redeemCount + protocolV2Log.redeemCount;
    volumePaid = volumePaid.plus(protocolV2Log.volumePaid);
    volumeRedeemed = volumeRedeemed.plus(protocolV2Log.volumeRedeemed);
  }

  const protocolV3Log = ProtocolV3Log.load(PROTOCOL_ID);
  if (protocolV3Log) {
    erc20Count = erc20Count + protocolV3Log.erc20Count;
    paymentsCount = paymentsCount + protocolV3Log.paymentsCount;
    projectsCount = projectsCount + protocolV3Log.projectsCount;
    redeemCount = redeemCount + protocolV3Log.redeemCount;
    volumePaid = volumePaid.plus(protocolV3Log.volumePaid);
    volumeRedeemed = volumeRedeemed.plus(protocolV3Log.volumeRedeemed);
  }

  protocolLog.erc20Count = erc20Count;
  protocolLog.paymentsCount = paymentsCount;
  protocolLog.projectsCount = projectsCount;
  protocolLog.redeemCount = redeemCount;
  protocolLog.volumePaid = volumePaid;
  protocolLog.volumeRedeemed = volumeRedeemed;
  protocolLog.save();
}

/**
 * Differs from next function because terminal prop isn't optional.
 *
 * By only using this function in Terminal contract handlers, we can
 * avoid forgetting to pass the `terminal` arg.
 */
export function saveNewProjectTerminalEvent(
  event: ethereum.Event,
  projectId: BigInt,
  id: string,
  pv: Version,
  key: ProjectEventKey,
  terminal: Bytes
): void {
  saveNewProjectEvent(event, projectId, id, pv, key, terminal);
}

export function saveNewProjectEvent(
  event: ethereum.Event,
  projectId: BigInt,
  id: string,
  pv: Version,
  key: ProjectEventKey,
  terminal: Bytes | null = null
): void {
  let projectEvent = new ProjectEvent(
    idForProjectEvent(
      projectId,
      pv,
      event.transaction.hash,
      event.transactionLogIndex
    )
  );
  if (!projectEvent) return;
  projectEvent.pv = pv;
  if (terminal) projectEvent.terminal = terminal;
  projectEvent.projectId = projectId.toI32();
  projectEvent.timestamp = event.block.timestamp.toI32();
  projectEvent.project = idForProject(projectId, pv);

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
    case ProjectEventKey.configureEvent:
      projectEvent.configureEvent = id;
      break;
    case ProjectEventKey.initEvent:
      projectEvent.initEvent = id;
      break;
    case ProjectEventKey.v1ConfigureEvent:
      projectEvent.v1ConfigureEvent = id;
      break;
    case ProjectEventKey.v1InitEvent:
      projectEvent.v1InitEvent = id;
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
  pv: Version,
  projectId: BigInt,
  wallet: Bytes
): Participant {
  const participant = new Participant(idForParticipant(projectId, pv, wallet));
  participant.pv = pv;
  participant.projectId = projectId.toI32();
  participant.project = idForProject(projectId, pv);
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

export function updateProjectHandle(
  projectId: BigInt,
  blockNumber: BigInt
): void {
  if (!address_shared_jbProjectHandles) return;

  // If there is a legacy jbProjectHandles address and the block height is prior to the jbProjectHandles startBlock, use the legacy address
  const projectHandlesAddress =
    address_shared_legacy_jbProjectHandles &&
    startBlock_shared_jbProjectHandles &&
    blockNumber.toI32() < startBlock_shared_jbProjectHandles
      ? address_shared_legacy_jbProjectHandles
      : address_shared_jbProjectHandles;

  const jbProjectHandles = JBProjectHandles.bind(
    Address.fromString(projectHandlesAddress!)
  );
  const handleCallResult = jbProjectHandles.try_handleOf(projectId);
  const pv = "2";
  const project = Project.load(idForProject(projectId, pv));
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

export function newPV2ConfigureEvent(
  // Note: Can't use an object arg here because assemblyscript
  // We could pass the configure event itself as an arg, but we could only type it as a V2 *OR* V3 JBFundingCycleStore.configure event.
  event: ethereum.Event,
  projectId: BigInt,
  duration: BigInt,
  weight: BigInt,
  discountRate: BigInt,
  ballot: Bytes,
  mustStartAtOrAfter: BigInt,
  configuration: BigInt,
  metadata: BigInt
): ConfigureEvent {
  const pv: Version = "2";

  const configureEvent = new ConfigureEvent(
    idForProjectTx(projectId, pv, event)
  );

  configureEvent.projectId = projectId.toI32();
  configureEvent.project = idForProject(projectId, pv);
  configureEvent.timestamp = event.block.timestamp.toI32();
  configureEvent.txHash = event.transaction.hash;
  configureEvent.caller = event.transaction.from;

  // From the cycle's JBFundingCycleData
  configureEvent.duration = duration.toI32();
  configureEvent.weight = weight;
  configureEvent.discountRate = discountRate;
  configureEvent.ballot = ballot;

  // Top level
  configureEvent.mustStartAtOrAfter = mustStartAtOrAfter.toI32();
  configureEvent.configuration = configuration.toI32();
  configureEvent.metadata = metadata;

  // Unpacking global metadata.
  const globalMetadata = metadata.rightShift(8).bitAnd(BigInt.fromI32(BITS_8));
  configureEvent.setTerminalsAllowed = !globalMetadata
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.setControllerAllowed = !globalMetadata
    .rightShift(1)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.transfersPaused = !globalMetadata
    .rightShift(2)
    .bitAnd(BigInt.fromI32(1))
    .isZero();

  // Unpacking metadata. See github.com/jbx-protocol/juice-contracts-v3/blob/main/contracts/libraries/JBFundingCycleMetadataResolver.sol
  configureEvent.reservedRate = metadata
    .rightShift(24)
    .bitAnd(BigInt.fromI32(BITS_16))
    .toI32();

  configureEvent.redemptionRate = BigInt.fromI32(MAX_REDEMPTION_RATE)
    .minus(metadata.rightShift(40).bitAnd(BigInt.fromI32(BITS_16)))
    .toI32();

  configureEvent.ballotRedemptionRate = BigInt.fromI32(MAX_REDEMPTION_RATE)
    .minus(metadata.rightShift(56).bitAnd(BigInt.fromI32(BITS_16)))
    .toI32();

  configureEvent.payPaused = !metadata
    .rightShift(72)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.distributionsPaused = !metadata
    .rightShift(73)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.redeemPaused = !metadata
    .rightShift(74)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.burnPaused = !metadata
    .rightShift(75)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.mintingAllowed = !metadata
    .rightShift(76)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.terminalMigrationAllowed = !metadata
    .rightShift(77)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.controllerMigrationAllowed = !metadata
    .rightShift(78)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.shouldHoldFees = !metadata
    .rightShift(79)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.preferClaimedTokenOverride = !metadata
    .rightShift(80)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.useTotalOverflowForRedemptions = !metadata
    .rightShift(81)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.useDataSourceForPay = !metadata
    .rightShift(82)
    .bitAnd(BigInt.fromI32(1))
    .isZero();
  configureEvent.useDataSourceForRedeem = !metadata
    .rightShift(83)
    .bitAnd(BigInt.fromI32(1))
    .isZero();

  configureEvent.dataSource = Bytes.fromByteArray(
    Bytes.fromBigInt(
      metadata.rightShift(84).bitAnd(
        // Convert to uint160
        BigInt.fromSignedBytes(Bytes.fromHexString(BITS_160_HEX))
      )
    )
  );
  configureEvent.metametadata = metadata.rightShift(244).toI32();

  return configureEvent;
}
