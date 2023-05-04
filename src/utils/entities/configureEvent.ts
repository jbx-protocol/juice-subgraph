import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { ConfigureEvent } from "../../../generated/schema";
import {
  BIGINT_1,
  BITS_16,
  BITS_8,
  MAX_REDEMPTION_RATE,
} from "../../constants";
import { PV } from "../../enums";
import { bytes20FromUint } from "../format";
import { idForConfigureEvent, idForProject } from "../ids";

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
  metadata: BigInt,
  caller: Bytes,
  memo: string | null = null
): ConfigureEvent {
  // TODO how to add `distributionLimitOf` result, which requires a terminal argument?

  const pv = PV.PV2

  const configureEvent = new ConfigureEvent(
    idForConfigureEvent(projectId, pv, event)
  );

  configureEvent.projectId = projectId.toI32();
  configureEvent.project = idForProject(projectId, pv);
  configureEvent.timestamp = event.block.timestamp.toI32();
  configureEvent.txHash = event.transaction.hash;
  configureEvent.caller = caller;
  configureEvent.from = event.transaction.from;

  // From the cycle's JBFundingCycleData
  configureEvent.duration = duration.toI32();
  configureEvent.weight = weight;
  configureEvent.discountRate = discountRate;
  configureEvent.ballot = ballot;
  configureEvent.memo = memo;

  // Top level
  configureEvent.mustStartAtOrAfter = mustStartAtOrAfter.toI32();
  configureEvent.configuration = configuration.toI32();
  configureEvent.metadata = metadata;

  // Unpacking global metadata.
  const globalMetadata = metadata.rightShift(8).bitAnd(BigInt.fromI32(BITS_8));
  configureEvent.setTerminalsAllowed = !globalMetadata
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.setControllerAllowed = !globalMetadata
    .rightShift(1)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.transfersPaused = !globalMetadata
    .rightShift(2)
    .bitAnd(BIGINT_1)
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

  configureEvent.pausePay = !metadata
    .rightShift(72)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.distributionsPaused = !metadata
    .rightShift(73)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.redeemPaused = !metadata
    .rightShift(74)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.burnPaused = !metadata
    .rightShift(75)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.mintingAllowed = !metadata
    .rightShift(76)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.terminalMigrationAllowed = !metadata
    .rightShift(77)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.controllerMigrationAllowed = !metadata
    .rightShift(78)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.shouldHoldFees = !metadata
    .rightShift(79)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.preferClaimedTokenOverride = !metadata
    .rightShift(80)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.useTotalOverflowForRedemptions = !metadata
    .rightShift(81)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.useDataSourceForPay = !metadata
    .rightShift(82)
    .bitAnd(BIGINT_1)
    .isZero();
  configureEvent.useDataSourceForRedeem = !metadata
    .rightShift(83)
    .bitAnd(BIGINT_1)
    .isZero();

  configureEvent.dataSource = bytes20FromUint(metadata.rightShift(84));
  configureEvent.metametadata = metadata.rightShift(244).toI32();

  return configureEvent;
}
