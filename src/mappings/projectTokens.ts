import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/TreasuryToken/ERC20";
import { handleProjectERC20Transfer } from "./erc20";

export const indexedProjectERC20s: string[] = ["1", "2", "7", "8"]

export function handleJBXTransfer(event: Transfer): void {
  handleProjectERC20Transfer(BigInt.fromString("1"), event);
}
 
export function handleTILETransfer(event: Transfer): void {
  handleProjectERC20Transfer(BigInt.fromString("2"), event);
}
 
export function handleSHARKTransfer(event: Transfer): void {
  handleProjectERC20Transfer(BigInt.fromString("7"), event);
}
 
export function handleCNDTransfer(event: Transfer): void {
  handleProjectERC20Transfer(BigInt.fromString("8"), event);
}