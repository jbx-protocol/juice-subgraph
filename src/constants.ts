import { Address, BigInt } from "@graphprotocol/graph-ts";

export const PROTOCOL_ID = "1";
export const MAX_REDEMPTION_RATE = 10_000;
export const BITS_8 = 0b11111111;
export const BITS_16 = 0b1111111111111111;
export const BIGINT_1 = BigInt.fromI32(1);
export const ADDRESS_ZERO = Address.fromI32(0);

/**
 * Trending calculations are complex. to alleviate indexing computation load, we don't run calculations on blocks with timestamps older than this
 */
export const BEGIN_TRENDING_TIMESTAMP = 1644474376; // feb 10 2022 - 1 year ago from the time i wrote this

export const BIGINT_WAD = BigInt.fromString("1000000000000000000");

export const V1_CURRENCY_USD = BigInt.fromI32(1);
export const V2V3_CURRENCY_ETH = BigInt.fromI32(1);
export const V2V3_CURRENCY_USD = BigInt.fromI32(2);