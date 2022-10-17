import { BigInt, log } from "@graphprotocol/graph-ts";

import { PayEvent, Project, ProtocolLog } from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";
import { idForPrevPayEvent } from "./ids";

export function handleTrendingPayment(timestamp: BigInt): void {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) return;

  // Only perform intensive computation at most every 5 min
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

  // Reset all projects trending data
  for (let i = 0; i < latestPayEventId; i++) {
    // Reverse iterate over payEvents
    const payEventId = (latestPayEventId - i).toString().split(".")[0];
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

    // Stop once oldest trending payEvent is reached
    if (payEvent.id == protocolLog.oldestTrendingPayEvent) break;
  }

  // Update all projects trending data
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

    const project = Project.load(payEvent.project);
    if (!project) {
      log.error(
        "[handleTrendingPayment: update stats] Failed to load project {}",
        [payEvent.project]
      );
      continue;
    }

    // Stop once payEvent timestamp is outside of current period
    if (payEvent.timestamp < oldestValidTimestamp) {
      // Set new oldestTrendingPayEvent
      protocolLog.oldestTrendingPayEvent = payEvent.id;
      break;
    }

    // Update project trending stats
    project.trendingPaymentsCount = project.trendingPaymentsCount + 1;
    project.trendingVolume = project.trendingVolume.plus(payEvent.amount);
    project.trendingScore = calculateTrendingScore(
      project.trendingVolume,
      BigInt.fromI32(project.trendingPaymentsCount)
    );
    project.save();
  }

  protocolLog.trendingLastUpdatedTimestamp = timestamp.toI32();
  protocolLog.save();

  log.info(
    "[handleTrendingPayment] Updated trending stats using payments range {}-{} at timestamp {}",
    [
      (protocolLog.oldestTrendingPayEvent || "0") as string,
      latestPayEventId.toString(),
      timestamp.toString().split(".")[0],
    ]
  );
}

// Algorithm to rank trending projects
function calculateTrendingScore(volume: BigInt, paymentsCount: BigInt): BigInt {
  // trendingScore = volume * (number of payments)^2
  return volume.times(paymentsCount.pow(2));
}
