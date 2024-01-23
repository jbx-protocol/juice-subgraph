import { BigInt, log } from "@graphprotocol/graph-ts";

import { PayEvent, Project, ProtocolLog } from "../../generated/schema";
import { BEGIN_TRENDING_TIMESTAMP, BIGINT_0, PROTOCOL_ID } from "../constants";

const TRENDING_WINDOW_DAYS = 7;
const BUFFER_TIME_MIN = 20;

export function handleTrendingPayment(
  timestamp: BigInt,
  latestPayEventId: string
): void {
  if (timestamp.toI32() < BEGIN_TRENDING_TIMESTAMP) return;

  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) return;

  /**
   * This routine can be demanding, so we only run it once per buffer time (at most)
   */
  if (
    protocolLog.trendingLastUpdatedTimestamp >=
    timestamp.toI32() - BUFFER_TIME_MIN * 60
  ) {
    return;
  }

  const oldestValidTimestamp =
    timestamp.toI32() - TRENDING_WINDOW_DAYS * 24 * 60 * 60;
  const didResetProjects: string[] = [];
  let latestInvalidTrendingPayEvent: string | null = null;

  /**
   * Reverse-chronologically iterate over all payments until we get to the `latestInvalidTrendingPayEvent`, which is the most recent pay event that fell outside of the trending window during the last update to trending stats.
   *
   * For the project that received each payment, reset its stats (once) and then update its trending stats.
   */
  for (
    let i = parseInt(latestPayEventId);
    i > parseInt((protocolLog.latestInvalidTrendingPayEvent || "0")!);
    i--
  ) {
    const payEventId = i.toString().split(".")[0]; // Math op converts int to float, so we split decimal
    const payEvent = PayEvent.load(payEventId);
    if (!payEvent) {
      log.error(
        "[handleTrendingPayment: update stats] Failed to load payEvent {}",
        [payEventId]
      );
      continue;
    }

    const project = Project.load(payEvent.project);
    if (!project) {
      log.error(
        "[handleTrendingPayment: update stats] Failed to load project {}",
        [payEvent.project]
      );
      continue;
    }

    /**
     * Every trending project should be reset to 0 before any calculations. This ensures any previous stats from payments now outside of the trending window are discarded.
     */
    if (!didResetProjects.includes(project.id)) {
      project.trendingScore = BIGINT_0;
      project.trendingPaymentsCount = BIGINT_0.toI32();
      project.trendingVolume = BIGINT_0;
      project.createdWithinTrendingWindow =
        project.createdAt > oldestValidTimestamp;
      project.save();

      if (project.id == "2-618") {
        log.warning("RESET Project — count: {}, volume: {}", [
          project.trendingPaymentsCount.toString(),
          project.trendingVolume.toString(),
        ]);
      }

      didResetProjects.push(project.id);
    }

    /**
     * Set new latestInvalidTrendingPayEvent once timestamp is outside of trending time window.
     */
    if (payEvent.timestamp < oldestValidTimestamp) {
      if (latestInvalidTrendingPayEvent == null) {
        latestInvalidTrendingPayEvent = payEvent.id;
      }

      continue;
    }

    /**
     * Update project trending stats
     */
    project.trendingPaymentsCount = project.trendingPaymentsCount + 1;
    project.trendingVolume = project.trendingVolume.plus(payEvent.amount);
    updateTrendingScore(project);
    project.save();
  }

  protocolLog.latestInvalidTrendingPayEvent = latestInvalidTrendingPayEvent;
  protocolLog.trendingLastUpdatedTimestamp = timestamp.toI32();
  protocolLog.save();

  log.info(
    "[handleTrendingPayment] Updated trending stats using payments {}-{} at timestamp {}",
    [
      (protocolLog.latestInvalidTrendingPayEvent || "0") as string,
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
    BigInt.fromI32(project.trendingPaymentsCount).pow(2)
  );
}
