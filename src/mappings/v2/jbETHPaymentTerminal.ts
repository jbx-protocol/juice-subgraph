import {
  AddToBalance,
  DistributePayouts,
  DistributeToPayoutSplit,
  Migrate,
  Pay,
  RedeemTokens,
  UseAllowance,
} from "../../../generated/JBETHPaymentTerminal/JBETHPaymentTerminal";
import {
  Participant,
  PayEvent,
  Project,
  RedeemEvent,
} from "../../../generated/schema";
import { CV } from "../../types";
import { idForParticipant, idForProject } from "../../utils";

const CV: CV = 2;

export function handleAddToBalance(event: AddToBalance): void {}

export function handleDistributePayouts(event: DistributePayouts): void {}

export function handleDistributeToPayoutSplit(
  event: DistributeToPayoutSplit
): void {}

export function handleMigrate(event: Migrate): void {}

export function handlePay(event: Pay): void {
  let timestamp = event.block.timestamp;
  let caller = event.params.caller;

  let pay = new PayEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  let projectId = idForProject(event.params.projectId, CV);
  if (pay) {
    pay.amount = event.params.amount;
    pay.beneficiary = event.params.beneficiary;
    pay.caller = caller;
    pay.project = projectId;
    pay.note = event.params.memo;
    pay.timestamp = timestamp;
    pay.txHash = event.transaction.hash;
    pay.save();
  }

  let project = Project.load(projectId);
  if (!project) return;
  project.totalPaid = project.totalPaid.plus(event.params.amount);
  project.currentBalance = project.currentBalance.plus(event.params.amount);

  let participantId = idForParticipant(
    event.params.projectId,
    CV,
    event.params.beneficiary
  );
  let participant = Participant.load(participantId);
  if (participant === null) {
    participant = new Participant(participantId);
    participant.wallet = event.params.beneficiary;
    participant.totalPaid = event.params.amount;
    participant.project = project.id;
  } else {
    participant.totalPaid = event.params.amount.plus(participant.totalPaid);
  }
  participant.lastPaidTimestamp = event.block.timestamp;

  project.save();
  participant.save();
}

export function handleRedeemTokens(event: RedeemTokens): void {
  let timestamp = event.block.timestamp;
  let caller = event.params.caller;
  let projectId = idForProject(event.params.projectId, CV);

  let redeemEvent = new RedeemEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  if (redeemEvent) {
    redeemEvent.amount = event.params.tokenCount;
    redeemEvent.beneficiary = event.params.beneficiary;
    redeemEvent.caller = caller;
    redeemEvent.holder = event.params.holder;
    redeemEvent.returnAmount = event.params.claimedAmount;
    redeemEvent.project = projectId;
    redeemEvent.timestamp = timestamp;
    redeemEvent.txHash = event.transaction.hash;
    redeemEvent.save();
  }

  let project = Project.load(projectId);
  if (project) {
    project.totalRedeemed = project.totalRedeemed.plus(
      event.params.claimedAmount
    );
    project.currentBalance = project.currentBalance.minus(
      event.params.claimedAmount
    );
    project.save();
  }
}

export function handleUseAllowance(event: UseAllowance): void {}
