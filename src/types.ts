import { Address, BigInt } from "@graphprotocol/graph-ts";

export type TransferEvent = {
  params: {
    to: Address;
    from: Address;
    value: BigInt;
  };
};
