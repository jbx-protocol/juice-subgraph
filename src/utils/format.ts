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
