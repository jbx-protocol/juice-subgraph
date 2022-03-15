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
  ProjectEvent,
  ProtocolV2Log,
  RedeemEvent,
} from "../../../generated/schema";
import { CV } from "../../types";
import {
  idForParticipant,
  idForProject,
  idForProjectEvent,
  protocolId,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = 2;

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
  let projectId = idForProject(event.params.projectId, cv);
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

  let log = ProtocolV2Log.load(protocolId);
  if (!log) log = new ProtocolV2Log(protocolId);
  if (log) {
    log.volumePaid = log.volumePaid.plus(event.params.amount);
    log.paymentsCount = log.paymentsCount + 1;
    log.save();
  }
  updateProtocolEntity();

  let projectEvent = new ProjectEvent(
    idForProjectEvent(
      event.params.projectId,
      cv,
      event.transaction.hash,
      event.transactionLogIndex
    )
  );
  projectEvent.cv = cv;
  projectEvent.projectId = event.params.projectId;
  projectEvent.timestamp = event.block.timestamp;
  projectEvent.payEvent = pay.id;
  projectEvent.project = projectId;
  projectEvent.save();

  let project = Project.load(projectId);
  if (!project) return;
  project.totalPaid = project.totalPaid.plus(event.params.amount);
  project.currentBalance = project.currentBalance.plus(event.params.amount);

  let participantId = idForParticipant(
    event.params.projectId,
    cv,
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
  let projectId = idForProject(event.params.projectId, cv);

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

    let projectEvent = new ProjectEvent(
      idForProjectEvent(
        event.params.projectId,
        cv,
        event.transaction.hash,
        event.transactionLogIndex
      )
    );
    projectEvent.cv = cv;
    projectEvent.projectId = event.params.projectId;
    projectEvent.timestamp = event.block.timestamp;
    projectEvent.redeemEvent = redeemEvent.id;
    projectEvent.project = projectId;
    projectEvent.save();

    let log = ProtocolV2Log.load(protocolId);
    if (!log) log = new ProtocolV2Log(protocolId);
    if (log) {
      log.volumeRedeemed = log.volumeRedeemed.plus(event.params.tokenCount);
      log.redeemCount = log.redeemCount + 1;
      log.save();
    }
    updateProtocolEntity();
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
