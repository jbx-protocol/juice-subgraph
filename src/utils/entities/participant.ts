import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Participant, Wallet } from "../../../generated/schema";
import { PV } from "../../enums";
import { toHexLowercase } from "../format";
import { idForParticipant, idForProject } from "../ids";
import { BIGINT_0 } from "../../constants";

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
  participant.balance = BIGINT_0;
  participant.stakedBalance = BIGINT_0;
  participant.erc20Balance = BIGINT_0;
  participant.volume = BIGINT_0;
  participant.volumeUSD = BIGINT_0;
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
  wallet.volume = BIGINT_0;
  wallet.volumeUSD = BIGINT_0;
  return wallet;
}

export function updateParticipantBalance(participant: Participant): void {
  participant.balance = participant.erc20Balance.plus(
    participant.stakedBalance
  );
}
