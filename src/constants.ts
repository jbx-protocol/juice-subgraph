import { Bytes } from "@graphprotocol/graph-ts";

import { address_jbETHPaymentTerminal } from "./contractAddresses";

export const PROTOCOL_ID = "1";

export const v2Terminal = Bytes.fromHexString(address_jbETHPaymentTerminal);

export const jb721DelegateType = Bytes.fromHexString("0xb3bcbb79");
