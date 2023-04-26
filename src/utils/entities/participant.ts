import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Participant, Wallet } from "../../../generated/schema";
import { PV } from "../../enums";
import { toHexLowercase } from "../format";
import { idForParticipant, idForProject } from "../ids";

export function newParticipant(
  pv: PV,
  projectId: BigInt,
  wallet: Bytes
): Participant {
  const participant = new Participant(idForParticipant(projectId, pv, wallet));
  participant.pv = pv.toString();
  participant.projectId = projectId.toI32();
  participant.project = idForProject(projectId, pv);
  participant.address = wallet;
  participant.wallet = wallet.toHexString();
  participant.balance = BigInt.fromString("0");
  participant.stakedBalance = BigInt.fromString("0");
  participant.erc20Balance = BigInt.fromString("0");
  participant.volume = BigInt.fromString("0");
  participant.volumeUSD = BigInt.fromString("0");
  participant.lastPaidTimestamp = 0;
  participant.paymentsCount = 0;

  // Create a wallet any time we create a participant
  const walletId = toHexLowercase(wallet);
  let _wallet = Wallet.load(walletId);
  if (!_wallet) {
    _wallet = newWallet(walletId);
    _wallet.save();
  }

  return participant;
}

export function newWallet(id: string): Wallet {
  const wallet = new Wallet(id);
  wallet.lastPaidTimestamp = 0;
  wallet.volume = BigInt.fromString("0");
  wallet.volumeUSD = BigInt.fromString("0");
  return wallet;
}

export function updateParticipantBalance(participant: Participant): void {
  participant.balance = participant.erc20Balance.plus(
    participant.stakedBalance
  );
}
