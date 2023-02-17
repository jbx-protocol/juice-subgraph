import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Participant } from "../../../generated/schema";
import { PV } from "../../enums";
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
  participant.wallet = wallet;
  participant.balance = BigInt.fromString("0");
  participant.stakedBalance = BigInt.fromString("0");
  participant.unstakedBalance = BigInt.fromString("0");
  participant.totalPaid = BigInt.fromString("0");
  participant.totalPaidUSD = BigInt.fromString("0");
  participant.lastPaidTimestamp = 0;
  return participant;
}

export function updateParticipantBalance(participant: Participant): void {
  participant.balance = participant.unstakedBalance.plus(
    participant.stakedBalance
  );
}
