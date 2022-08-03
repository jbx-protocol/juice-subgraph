import { BigInt } from "@graphprotocol/graph-ts";

import { PayEventObj, Project, ProtocolLog } from "../../generated/schema";
import { PROTOCOL_ID } from "../constants";

export function handleTrendingPayment(
  project: string,
  amount: BigInt,
  timestamp: BigInt
): void {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);
  if (!protocolLog) return;

  const newPayEventObj = new PayEventObj(
    idForPayEventObj(project, amount, timestamp)
  );
  newPayEventObj.timestamp = timestamp;
  newPayEventObj.project = project;
  newPayEventObj.amount = amount;

  // Only perform intensive computation at most every 5 min
  const SECS_5_MIN = 5 * 60;
  if (
    protocolLog.trendingLastUpdatedTimestamp <
    timestamp.toI32() - SECS_5_MIN
  ) {
    addTrendingPaymentAndUpdateScores(protocolLog, newPayEventObj);
  } else {
    addTrendingPayment(protocolLog, newPayEventObj);
  }
}

function addTrendingPaymentAndUpdateScores(
  protocolLog: ProtocolLog,
  newPayEventObj: PayEventObj
): void {
  const payEvents = payEventsFromString(protocolLog.trendingPayments);

  // Reset trending stats for all previously trending projects
  for (let i = 0; i < payEvents.length; i++) {
    const project = Project.load(payEvents[i].project);
    if (project) {
      project.trendingScore = BigInt.fromString("0");
      project.trendingPaymentsCount = BigInt.fromString("0").toI32();
      project.trendingVolume = BigInt.fromString("0");
      project.save();
    }
  }

  const currentPayEvents: PayEventObj[] = [newPayEventObj];

  // Filter out payments older than 7 days
  // Note: using for loop as map() is not supported
  for (let i = 0; i < payEvents.length; i++) {
    const SECS_7_DAYS = 7 * 24 * 60 * 60;
    const event = payEvents[i];
    if (
      event.timestamp >=
      BigInt.fromI32(newPayEventObj.timestamp.toI32() - SECS_7_DAYS)
    ) {
      currentPayEvents.push(event);
    }
  }

  // Update trending score for all projects with current pay events
  for (let i = 0; i < currentPayEvents.length; i++) {
    const event = currentPayEvents[i];
    const project = Project.load(event.project);
    if (project) {
      project.trendingPaymentsCount = project.trendingPaymentsCount + 1;
      project.trendingVolume = project.trendingVolume.plus(event.amount);
      project.trendingScore = trendingScoreForProject(
        project.trendingVolume,
        BigInt.fromI32(project.trendingPaymentsCount)
      );
      project.save();
    }
  }

  protocolLog.trendingLastUpdatedTimestamp = newPayEventObj.timestamp.toI32();
  protocolLog.trendingPayments = payEventsToString(currentPayEvents);
  protocolLog.save();
}

function addTrendingPayment(
  protocolLog: ProtocolLog,
  newPayEventObj: PayEventObj
): void {
  const payEvents = payEventsFromString(protocolLog.trendingPayments);
  payEvents.unshift(newPayEventObj);
  protocolLog.trendingPayments = payEventsToString(payEvents);
  protocolLog.save();
}

function payEventsFromString(str: string): PayEventObj[] {
  const arr: PayEventObj[] = [];

  if (str.length) {
    const eventStrings = str.split(",");
    // Note: using for loop as map() is not supported
    for (let i = 0; i < eventStrings.length; i++) {
      const parts = eventStrings[i].split("/");
      let obj = new PayEventObj(str);
      obj.timestamp = BigInt.fromString(parts[0]);
      obj.project = parts[1];
      obj.amount = BigInt.fromString(parts[2]);
      arr.push(obj);
    }
  }

  return arr;
}

function payEventsToString(events: PayEventObj[]): string {
  let strings: string[] = [];

  // Note: using for loop as map() is not supported
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    strings.push(idForPayEventObj(e.project, e.amount, e.timestamp));
  }
  return strings.join(",");
}

function idForPayEventObj(
  project: string,
  amount: BigInt,
  timestamp: BigInt
): string {
  return `${timestamp.toString()}/${project}/${amount.toString()}`;
}

// Algorithm to rank trending projects
function trendingScoreForProject(
  volume: BigInt,
  paymentsCount: BigInt
): BigInt {
  // trendingScore = volume * (number of payments)^2
  return volume.times(paymentsCount.pow(2));
}
