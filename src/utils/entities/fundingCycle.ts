import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { FundingCycle, Project } from "../../../generated/schema";
import { idForFundingCycle, idForProject } from "../ids";
import {
  BIGINT_0,
  BIGINT_1,
  BITS_16,
  BITS_8,
  MAX_REDEMPTION_RATE,
} from "../../constants";
import { bytes20FromUint } from "../format";
import { PV } from "../../enums";

/**
 * If latest funding cycle doesn't extend to the current timestamp, extrapolate funding cycles from last saved. Return latest fc.
 */
export function extrapolateLatestFC(
  projectId: BigInt,
  currentTimestamp: BigInt
): FundingCycle | null {
  const project = Project.load(idForProject(projectId, PV.PV2));

  if (!project) return null;

  let fc = FundingCycle.load(
    idForFundingCycle(projectId, BigInt.fromI32(project.latestFundingCycle))
  );

  if (!fc || fc.duration == 0) return fc;

  const maxLoopCount = 500;
  let counter = 0;

  // Extrapolate funding cycles since last saved fc
  while (
    fc.startTimestamp + fc.duration < currentTimestamp.toI32() &&
    counter < maxLoopCount
  ) {
    fc = newFundingCycle(
      projectId,
      BigInt.fromI32(fc.number + 1),
      BigInt.fromI32(fc.basedOn), // Extrapolated FCs should all have same basedOn value
      fc.metadata,
      BigInt.fromI32(fc.startTimestamp + fc.duration),
      BigInt.fromI32(fc.duration),
      fc.weight,
      fc.discountRate,
      fc.ballot,
      fc.configuration
    );
    fc.save();

    project.latestFundingCycle = fc.number;

    counter++;
  }

  project.save();

  return fc;
}

export function newFundingCycle(
  projectId: BigInt,
  number: BigInt,
  basedOn: BigInt,
  metadata: BigInt,
  startTimestamp: BigInt,
  duration: BigInt,
  weight: BigInt,
  discountRate: BigInt,
  ballot: Bytes,
  configuration: BigInt,
  mustStartAtOrAfter: BigInt | null = null
): FundingCycle {
  const fc = new FundingCycle(idForFundingCycle(projectId, number));

  fc.number = number.toI32();
  fc.basedOn = basedOn.toI32();
  fc.projectId = projectId.toI32();
  fc.project = idForProject(projectId, PV.PV2);
  fc.startTimestamp = startTimestamp.toI32();
  if (duration.gt(BIGINT_0)) {
    fc.endTimestamp = startTimestamp.plus(duration).toI32();
  }
  fc.duration = duration.toI32();
  fc.weight = weight;
  fc.discountRate = discountRate;
  fc.ballot = ballot;
  fc.configuration = configuration;
  fc.metadata = metadata;
  fc.withdrawnAmount = BIGINT_0;
  if (mustStartAtOrAfter) fc.mustStartAtOrAfter = mustStartAtOrAfter.toI32();

  // Unpacking global metadata.
  const globalMetadata = metadata.rightShift(8).bitAnd(BigInt.fromI32(BITS_8));
  fc.setTerminalsAllowed = !globalMetadata.bitAnd(BIGINT_1).isZero();
  fc.setControllerAllowed = !globalMetadata
    .rightShift(1)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.transfersPaused = !globalMetadata
    .rightShift(2)
    .bitAnd(BIGINT_1)
    .isZero();

  // Unpacking metadata. See github.com/jbx-protocol/juice-contracts-v3/blob/main/contracts/libraries/JBFundingCycleMetadataResolver.sol
  fc.reservedRate = metadata
    .rightShift(24)
    .bitAnd(BigInt.fromI32(BITS_16))
    .toI32();
  fc.redemptionRate = BigInt.fromI32(MAX_REDEMPTION_RATE)
    .minus(metadata.rightShift(40).bitAnd(BigInt.fromI32(BITS_16)))
    .toI32();
  fc.ballotRedemptionRate = BigInt.fromI32(MAX_REDEMPTION_RATE)
    .minus(metadata.rightShift(56).bitAnd(BigInt.fromI32(BITS_16)))
    .toI32();
  fc.pausePay = !metadata
    .rightShift(72)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.distributionsPaused = !metadata
    .rightShift(73)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.redeemPaused = !metadata
    .rightShift(74)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.burnPaused = !metadata
    .rightShift(75)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.mintingAllowed = !metadata
    .rightShift(76)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.terminalMigrationAllowed = !metadata
    .rightShift(77)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.controllerMigrationAllowed = !metadata
    .rightShift(78)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.shouldHoldFees = !metadata
    .rightShift(79)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.preferClaimedTokenOverride = !metadata
    .rightShift(80)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.useTotalOverflowForRedemptions = !metadata
    .rightShift(81)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.useDataSourceForPay = !metadata
    .rightShift(82)
    .bitAnd(BIGINT_1)
    .isZero();
  fc.useDataSourceForRedeem = !metadata
    .rightShift(83)
    .bitAnd(BIGINT_1)
    .isZero();

  fc.dataSource = bytes20FromUint(metadata.rightShift(84));
  fc.metametadata = metadata.rightShift(244).toI32();

  return fc;
}
