import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export function isNumberString(str: string): boolean {
  return str.length
    ? str
        .trim()
        .split("")
        .every((char) =>
          ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(char)
        )
    : false;
}

export function toHexLowercase(x: Bytes): string {
  return x.toHexString().toLowerCase();
}

export function bytes20FromUint(uint: BigInt): Bytes | null {
  return Bytes.fromHexString(
    uint
      .toHexString()
      .substring(2, 42)
      .padStart(40, "0") // Occasionally toHexString() cuts off a leading 0. This can't be reproduced with `Bytes.fromHexString('0x...').toHexString()` so likely has something to do with passing a bitShifted `uint` argument
  );

  // We've also attempted to use the BigInt.bitAnd() operator to trim bytes, which requires reverse()ing the byte array to convert from big-endian to little-endian. However using byte arrays sometimes results in an unexpected extra 0x00 byte at the start of the (little-endian) array. The chosen substring() method above seems like the simplest/least-bad option.
}
