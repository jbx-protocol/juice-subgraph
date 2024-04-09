import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { JBPrices3 } from "../../../generated/JBETHPaymentTerminal3_1_2/JBPrices3";
import {
  BIGINT_WAD,
  V2V3_CURRENCY_ETH,
  V2V3_CURRENCY_USD,
} from "../../constants";
import { address_v3_jbPrices } from "../../contractAddresses";

export function v3USDPriceForEth(ethAmount: BigInt): BigInt | null {
  if (!address_v3_jbPrices) return null;

  const pricesContract = JBPrices3.bind(
    Address.fromBytes(Bytes.fromHexString(address_v3_jbPrices!))
  );

  const priceForCall = pricesContract.try_priceFor(
    V2V3_CURRENCY_USD,
    V2V3_CURRENCY_ETH,
    BigInt.fromI32(18)
  );
  if (priceForCall.reverted) {
    log.error("[v3USDPriceForEth] priceFor() reverted", []);
    return null;
  }

  return ethAmount.times(priceForCall.value).div(BIGINT_WAD);
}
