import { BigInt, log } from "@graphprotocol/graph-ts";

import { PayEvent, Project, ProtocolLog } from "../../generated/schema";
import { BEGIN_TRENDING_TIMESTAMP, BIGINT_0, PROTOCOL_ID } from "../constants";

export function handleTrendingPayment(
  timestamp: BigInt,
  latestPayEventId: string
): void {
  if (timestamp.toI32() < BEGIN_TRENDING_TIMESTAMP) return;

  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) return;

  /**
   * These calculations are big, so we only run them at most every 20 min
   */
  const SECS_20_MIN = 20 * 60;
  if (
    protocolLog.trendingLastUpdatedTimestamp >=
    timestamp.toI32() - SECS_20_MIN
  ) {
    return;
  }

  const _latestPayEventId = parseInt(latestPayEventId);

  const TRENDING_WINDOW_DAYS = 7;
  const oldestValidTimestamp =
    timestamp.toI32() - TRENDING_WINDOW_DAYS * 24 * 60 * 60;

  /**
   * We first reset the trending score for ALL trending projects.
   *
   * We reverse-chronologically iterate over all payments until we get to the
   * `oldestTrendingPayEvent`.
   *
   * We know that if a project hasn't received a payment after the
   * `oldestTrendingPayEvent` timestamp, its trending stats are already 0 due
   * to having been previously reset.
   */
  const didResetProjects: string[] = [];
  for (let i = _latestPayEventId; i > 0; i--) {
    // Reverse iterate over payEvents. Math op converts int to float, so we split decimal
    const payEventId = i.toString().split(".")[0];

    // Stop once oldest trending payEvent is reached
    if (payEventId == protocolLog.oldestTrendingPayEvent) break;

    const payEvent = PayEvent.load(payEventId);
    if (!payEvent) {
      log.error(
        "[handleTrendingPayment: reset stats] Failed to load payEvent {}",
        [payEventId]
      );
      continue;
    }

    // No need to reset a project twice
    if (didResetProjects.includes(payEvent.project)) continue;

    const project = Project.load(payEvent.project);
    if (!project) {
      log.error(
        "[handleTrendingPayment: reset stats] Failed to load project {}",
        [payEvent.project]
      );
      continue;
    }

    // Reset project trending stats
    project.trendingScore = BIGINT_0;
    project.trendingPaymentsCount = BIGINT_0.toI32();
    project.trendingVolume = BIGINT_0;
    project.createdWithinTrendingWindow =
      project.createdAt > oldestValidTimestamp;
    project.save();

    // Store project id so we don't load it twice
    didResetProjects.push(project.id);
  }

  /**
   * Next we calculate new trending stats.
   *
   * We reverse-chronologically iterate over all payments until we get to the
   * `oldestValidTimestamp`. We then record new `oldestTrendingPayEvent`.
   *
   * For each payment, update the trending stats of the project that received it.
   */
  for (let i = _latestPayEventId; i > 0; i--) {
    // Reverse iterate over payEvents. Math op converts int to float, so we split decimal
    const payEventId = i.toString().split(".")[0];

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
       * trending stats, we'll know that this pay event and all previous
       * pay events can be ignored.
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
    updateTrendingScore(project);
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
function updateTrendingScore(project: Project): void {
  project.trendingScore = project.trendingVolume.times(
    BigInt.fromI32(project.paymentsCount).pow(2)
  );
}
