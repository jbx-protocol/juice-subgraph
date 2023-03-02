import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { Prices } from "../../../generated/TerminalV1/Prices";
import { BIGINT_WAD, V1_CURRENCY_USD } from "../../constants";
import { address_v1_prices } from "../../contractAddresses";

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
