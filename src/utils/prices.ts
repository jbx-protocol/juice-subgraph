import {
  address_v1_prices,
  address_v2_jbPrices,
  address_v3_jbPrices,
} from "../contractAddresses";
import { Prices } from "../../generated/TerminalV1/Prices";
import { JBPrices as V2JBPrices } from "../../generated/V2JBETHPaymentTerminal/JBPrices";
import { JBPrices as V3JBPrices } from "../../generated/V3JBETHPaymentTerminal/JBPrices";
import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

const V1_CURRENCY_USD = BigInt.fromI32(1);
const V2V3_CURRENCY_ETH = BigInt.fromI32(1);
const V2V3_CURRENCY_USD = BigInt.fromI32(2);
const BIGINT_WAD = BigInt.fromString("1000000000000000000");

export function v1USDPriceForEth(ethAmount: BigInt): BigInt | null {
  if (!address_v1_prices) return null;

  const pricesContract = Prices.bind(
    Address.fromBytes(Bytes.fromHexString(address_v1_prices!))
  );

  const priceForCall = pricesContract.try_getETHPriceFor(V1_CURRENCY_USD);
  if (priceForCall.reverted) {
    log.error("[v1USDPriceForEth] getETHPriceFor() reverted", []);
    return null;
  }

  return ethAmount.times(priceForCall.value).div(BIGINT_WAD);
}

export function v2USDPriceForEth(ethAmount: BigInt): BigInt | null {
  if (!address_v2_jbPrices) return null;

  const pricesContract = V2JBPrices.bind(
    Address.fromBytes(Bytes.fromHexString(address_v2_jbPrices!))
  );

  const priceForCall = pricesContract.try_priceFor(
    V2V3_CURRENCY_ETH,
    V2V3_CURRENCY_USD,
    BigInt.fromI32(18)
  );
  if (priceForCall.reverted) {
    log.error("[v2USDPriceForEth] priceFor() reverted", []);
    return null;
  }

  return ethAmount.times(priceForCall.value).div(BIGINT_WAD);
}

export function v3USDPriceForEth(ethAmount: BigInt): BigInt | null {
  if (!address_v3_jbPrices) return null;

  const pricesContract = V3JBPrices.bind(
    Address.fromBytes(Bytes.fromHexString(address_v3_jbPrices!))
  );

  const priceForCall = pricesContract.try_priceFor(
    V2V3_CURRENCY_ETH,
    V2V3_CURRENCY_USD,
    BigInt.fromI32(18)
  );
  if (priceForCall.reverted) {
    log.error("[v3USDPriceForEth] priceFor() reverted", []);
    return null;
  }

  return ethAmount.times(priceForCall.value).div(BIGINT_WAD);
}
