import { BigInt, log } from "@graphprotocol/graph-ts";

import { PayEvent, Project, ProtocolLog } from "../../generated/schema";
import { BEGIN_TRENDING_TIMESTAMP, PROTOCOL_ID } from "../constants";
import { idForPrevPayEvent } from "./ids";

export function handleTrendingPayment(timestamp: BigInt): void {
  if (timestamp.toI32() < BEGIN_TRENDING_TIMESTAMP) return;

  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) return;

  /**
   * These calculations are big, so we only run them at most every 5 min
   */
  const SECS_5_MIN = 5 * 60;
  if (
    protocolLog.trendingLastUpdatedTimestamp >=
    timestamp.toI32() - SECS_5_MIN
  ) {
    return;
  }

  const latestPayEventId = parseInt(idForPrevPayEvent());

  const SECS_7_DAYS = 7 * 24 * 60 * 60;
  const oldestValidTimestamp = timestamp.toI32() - SECS_7_DAYS;

  /**
   * We first reset the trending score for ALL trending projects. We're able
   * to load trending projects by loading pay events newer than the
   * `oldestTrendingPayEvent` and using `payEvent.project`
   *
   * We know that if a project hasn't received a payment after the
   * `oldestTrendingPayEvent` timestamp, its trending stats are already 0
   */
  const didResetProjects: string[] = [];

  for (let i = 0; i < latestPayEventId; i++) {
    // Reverse iterate over payEvents
    const payEventId = (latestPayEventId - i).toString().split(".")[0];

    // Stop once oldest trending payEvent is reached
    if (payEventId == protocolLog.oldestTrendingPayEvent) break;

    // No need to reset a project twice
    if (didResetProjects.includes(payEventId)) continue;

    const payEvent = PayEvent.load(payEventId);
    if (!payEvent) {
      log.error(
        "[handleTrendingPayment: reset stats] Failed to load payEvent {}",
        [payEventId]
      );
      continue;
    }

    const project = Project.load(payEvent.project);
    if (!project) {
      log.error(
        "[handleTrendingPayment: reset stats] Failed to load project {}",
        [payEvent.project]
      );
      continue;
    }

    // Reset project trending stats
    project.trendingScore = BigInt.fromString("0");
    project.trendingPaymentsCount = BigInt.fromString("0").toI32();
    project.trendingVolume = BigInt.fromString("0");
    project.createdWithinTrendingWindow =
      project.createdAt > oldestValidTimestamp;
    project.save();

    // Store project id so we don't load it twice
    didResetProjects.push(project.id);
  }

  /**
   * Next we calculate trending stats for all projects.
   *
   * We reverse-chronologically iterate over all payments until we get to the
   * `oldestTrendingPayEvent`. For each payment, update the trending stats of
   * the project that received it.
   */
  for (let i = 0; i < latestPayEventId; i++) {
    // Reverse iterate over payEvents
    const payEventId = (latestPayEventId - i).toString().split(".")[0];
    const payEvent = PayEvent.load(payEventId);
    if (!payEvent) {
      log.error(
        "[handleTrendingPayment: update stats] Failed to load payEvent {}",
        [payEventId]
      );
      continue;
    }

    // Stop once payEvent timestamp is outside of trending time window
    if (payEvent.timestamp < oldestValidTimestamp) {
      /**
       * Store new `oldestTrendingPayEvent`. The next time we calculate
       * trending stats, we'll know that this pay event and all pay events
       * before it can be ignored.
       */
      protocolLog.oldestTrendingPayEvent = payEvent.id;
      break;
    }

    const project = Project.load(payEvent.project);
    if (!project) {
      log.error(
        "[handleTrendingPayment: update stats] Failed to load project {}",
        [payEvent.project]
      );
      continue;
    }

    // Update properties for each trending payEvent
    project.trendingPaymentsCount = project.trendingPaymentsCount + 1;
    project.trendingVolume = project.trendingVolume.plus(payEvent.amount);

    /**
     * The score for a project is recalculated with every payment it has
     * received within the trending window, using its stored
     * `trendingPaymentsCount` and `trendingVolume` properties
     */
    project.trendingScore = calculateTrendingScore(
      project.trendingVolume,
      BigInt.fromI32(project.trendingPaymentsCount)
    );
    project.save();
  }

  protocolLog.trendingLastUpdatedTimestamp = timestamp.toI32();
  protocolLog.save();

  log.info(
    "[handleTrendingPayment] Updated trending stats using payments {}-{} at timestamp {}",
    [
      (protocolLog.oldestTrendingPayEvent || "0") as string,
      latestPayEventId.toString(),
      timestamp.toString().split(".")[0],
    ]
  );
}

/**
 * Algorithm to calculate a trending score for a project,
 * using its volume and the number of payments received.
 *
 * score = volume * (number of payments)^2
 */
function calculateTrendingScore(volume: BigInt, paymentsCount: BigInt): BigInt {
  return volume.times(paymentsCount.pow(2));
}
