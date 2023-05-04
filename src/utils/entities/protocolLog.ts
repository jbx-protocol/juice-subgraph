import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  ProtocolLog,
  ProtocolV1Log,
  ProtocolV2Log,
  ProtocolV3Log,
} from "../../../generated/schema";
import { PROTOCOL_ID } from "../../constants";

export function newProtocolLog(): ProtocolLog {
  const protocolLog = new ProtocolLog(PROTOCOL_ID);
  protocolLog.projectsCount = 0;
  protocolLog.volume = BigInt.fromString("0");
  protocolLog.volumeUSD = BigInt.fromString("0");
  protocolLog.volumeRedeemed = BigInt.fromString("0");
  protocolLog.volumeRedeemedUSD = BigInt.fromString("0");
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
  protocolV1Log.volume = BigInt.fromString("0");
  protocolV1Log.volumeUSD = BigInt.fromString("0");
  protocolV1Log.volumeRedeemed = BigInt.fromString("0");
  protocolV1Log.volumeRedeemedUSD = BigInt.fromString("0");
  protocolV1Log.paymentsCount = 0;
  protocolV1Log.redeemCount = 0;
  protocolV1Log.erc20Count = 0;
  return protocolV1Log;
}

export function newProtocolV2Log(): ProtocolV2Log {
  const protocolV2Log = new ProtocolV2Log(PROTOCOL_ID);
  protocolV2Log.log = PROTOCOL_ID;
  protocolV2Log.projectsCount = 0;
  protocolV2Log.volume = BigInt.fromString("0");
  protocolV2Log.volumeUSD = BigInt.fromString("0");
  protocolV2Log.volumeRedeemed = BigInt.fromString("0");
  protocolV2Log.volumeRedeemedUSD = BigInt.fromString("0");
  protocolV2Log.paymentsCount = 0;
  protocolV2Log.redeemCount = 0;
  protocolV2Log.erc20Count = 0;
  return protocolV2Log;
}

export function newProtocolV3Log(): ProtocolV3Log {
  const protocolV3Log = new ProtocolV3Log(PROTOCOL_ID);
  protocolV3Log.log = PROTOCOL_ID;
  protocolV3Log.projectsCount = 0;
  protocolV3Log.volume = BigInt.fromString("0");
  protocolV3Log.volumeUSD = BigInt.fromString("0");
  protocolV3Log.volumeRedeemed = BigInt.fromString("0");
  protocolV3Log.volumeRedeemedUSD = BigInt.fromString("0");
  protocolV3Log.paymentsCount = 0;
  protocolV3Log.redeemCount = 0;
  protocolV3Log.erc20Count = 0;
  return protocolV3Log;
}

export function updateProtocolEntity(): void {
  const protocolLog = ProtocolLog.load(PROTOCOL_ID);

  if (!protocolLog) {
    log.error("[updateProtocolEntity] Failed to load protocolLog. ID:{}", [
      PROTOCOL_ID,
    ]);
    return;
  }

  let projectsCount = 0;
  let volume = BigInt.fromString("0");
  let volumeUSD = BigInt.fromString("0");
  let volumeRedeemed = BigInt.fromString("0");
  let volumeRedeemedUSD = BigInt.fromString("0");
  let paymentsCount = 0;
  let redeemCount = 0;
  let erc20Count = 0;

  const protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (protocolV1Log) {
    erc20Count = erc20Count + protocolV1Log.erc20Count;
    paymentsCount = paymentsCount + protocolV1Log.paymentsCount;
    projectsCount = projectsCount + protocolV1Log.projectsCount;
    redeemCount = redeemCount + protocolV1Log.redeemCount;
    volume = volume.plus(protocolV1Log.volume);
    volumeUSD = volumeUSD.plus(protocolV1Log.volumeUSD);
    volumeRedeemed = volumeRedeemed.plus(protocolV1Log.volumeRedeemed);
    volumeRedeemedUSD = volumeRedeemedUSD.plus(protocolV1Log.volumeRedeemedUSD);
  }

  const protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (protocolV2Log) {
    erc20Count = erc20Count + protocolV2Log.erc20Count;
    paymentsCount = paymentsCount + protocolV2Log.paymentsCount;
    projectsCount = projectsCount + protocolV2Log.projectsCount;
    redeemCount = redeemCount + protocolV2Log.redeemCount;
    volume = volume.plus(protocolV2Log.volume);
    volumeUSD = volumeUSD.plus(protocolV2Log.volumeUSD);
    volumeRedeemed = volumeRedeemed.plus(protocolV2Log.volumeRedeemed);
    volumeRedeemedUSD = volumeRedeemedUSD.plus(protocolV2Log.volumeRedeemedUSD);
  }

  const protocolV3Log = ProtocolV3Log.load(PROTOCOL_ID);
  if (protocolV3Log) {
    erc20Count = erc20Count + protocolV3Log.erc20Count;
    paymentsCount = paymentsCount + protocolV3Log.paymentsCount;
    projectsCount = projectsCount + protocolV3Log.projectsCount;
    redeemCount = redeemCount + protocolV3Log.redeemCount;
    volume = volume.plus(protocolV3Log.volume);
    volumeUSD = volumeUSD.plus(protocolV3Log.volumeUSD);
    volumeRedeemed = volumeRedeemed.plus(protocolV3Log.volumeRedeemed);
    volumeRedeemedUSD = volumeRedeemedUSD.plus(protocolV3Log.volumeRedeemedUSD);
  }

  protocolLog.erc20Count = erc20Count;
  protocolLog.paymentsCount = paymentsCount;
  protocolLog.projectsCount = projectsCount;
  protocolLog.redeemCount = redeemCount;
  protocolLog.volume = volume;
  protocolLog.volumeUSD = volumeUSD;
  protocolLog.volumeRedeemed = volumeRedeemed;
  protocolLog.volumeRedeemedUSD = volumeRedeemedUSD;
  protocolLog.save();
}
