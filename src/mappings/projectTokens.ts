import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/TreasuryToken/ERC20";
import { handleProjectERC20Transfer } from "./erc20";

export function handleJBXTransfer(event: Transfer): void {
  handleProjectERC20Transfer(new BigInt(1), event);
}
 
export function handleTILETransfer(event: Transfer): void {
  handleProjectERC20Transfer(new BigInt(2), event);
}
 
export function handleSHARKTransfer(event: Transfer): void {
  handleProjectERC20Transfer(new BigInt(7), event);
}
 
export function handleCNDTransfer(event: Transfer): void {
  handleProjectERC20Transfer(new BigInt(8), event);
}