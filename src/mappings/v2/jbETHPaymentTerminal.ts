import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  AddToBalance,
  DistributePayouts,
  DistributeToPayoutSplit,
  Pay,
  ProcessFee,
  RedeemTokens,
  UseAllowance,
} from "../../../generated/JBETHPaymentTerminal/JBETHPaymentTerminal";
import {
  DistributePayoutsEvent,
  DistributeToPayoutSplitEvent,
  Participant,
  PayEvent,
  Project,
  ProtocolV2Log,
  RedeemEvent,
  UseAllowanceEvent,
} from "../../../generated/schema";
import { PROTOCOL_ID } from "../../constants";
import { CV, ProjectEventKey } from "../../types";
import {
  newParticipant,
  newProtocolV2Log,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils/entity";
import {
  idForParticipant,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";
import { addToTrendingPayments } from "../../utils/payments";

const cv: CV = "2";

export function handleAddToBalance(event: AddToBalance): void {
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleAddToBalance] Missing project. ID:{}", [
      idForProject(event.params.projectId, cv),
    ]);
    return;
  }
  project.currentBalance = project.currentBalance.plus(event.params.amount);
  project.save();
}

export function handleDistributePayouts(event: DistributePayouts): void {
  const distributePayoutsEvent = new DistributePayoutsEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (!distributePayoutsEvent) {
    log.error(
      "[handleDistributePayouts] Missing distributePayoutsEvent. ID:{}",
      [idForProjectTx(event.params.projectId, cv, event)]
    );
    return;
  }
  distributePayoutsEvent.projectId = event.params.projectId.toI32();
  distributePayoutsEvent.timestamp = event.block.timestamp.toI32();
  distributePayoutsEvent.txHash = event.transaction.hash;
  distributePayoutsEvent.amount = event.params.amount;
  distributePayoutsEvent.beneficiary = event.params.beneficiary;
  distributePayoutsEvent.beneficiaryDistributionAmount =
    event.params.beneficiaryDistributionAmount;
  distributePayoutsEvent.caller = event.transaction.from;
  distributePayoutsEvent.distributedAmount = event.params.distributedAmount;
  distributePayoutsEvent.fee = event.params.fee;
  distributePayoutsEvent.fundingCycleConfiguration =
    event.params.fundingCycleConfiguration;
  distributePayoutsEvent.fundingCycleNumber = event.params.fundingCycleNumber.toI32();
  distributePayoutsEvent.memo = event.params.memo;
  distributePayoutsEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    distributePayoutsEvent.id,
    cv,
    ProjectEventKey.distributePayoutsEvent
  );
}

export function handleDistributeToPayoutSplit(
  event: DistributeToPayoutSplit
): void {
  const projectId = idForProject(event.params.projectId, cv);
  const distributePayoutSplitEvent = new DistributeToPayoutSplitEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );

  if (!distributePayoutSplitEvent) {
    log.error(
      "[handleDistributeToPayoutSplit] Missing distributePayoutSplitEvent. ID:{}",
      [idForProjectTx(event.params.projectId, cv, event, true)]
    );
    return;
  }
  distributePayoutSplitEvent.distributePayoutsEvent = idForProjectTx(
    event.params.projectId,
    cv,
    event
  );
  distributePayoutSplitEvent.project = projectId;
  distributePayoutSplitEvent.txHash = event.transaction.hash;
  distributePayoutSplitEvent.timestamp = event.block.timestamp.toI32();
  distributePayoutSplitEvent.amount = event.params.amount;
  distributePayoutSplitEvent.caller = event.transaction.from;
  distributePayoutSplitEvent.domain = event.params.domain;
  distributePayoutSplitEvent.group = event.params.group;
  distributePayoutSplitEvent.projectId = event.params.projectId.toI32();
  distributePayoutSplitEvent.splitProjectId = event.params.split.projectId.toI32();
  distributePayoutSplitEvent.allocator = event.params.split.allocator;
  distributePayoutSplitEvent.beneficiary = event.params.split.beneficiary;
  distributePayoutSplitEvent.lockedUntil = event.params.split.lockedUntil.toI32();
  distributePayoutSplitEvent.percent = event.params.split.percent.toI32();
  distributePayoutSplitEvent.preferClaimed = event.params.split.preferClaimed;
  distributePayoutSplitEvent.preferAddToBalance =
    event.params.split.preferAddToBalance;
  distributePayoutSplitEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    distributePayoutSplitEvent.id,
    cv,
    ProjectEventKey.distributeToPayoutSplitEvent
  );
}

export function handlePay(event: Pay): void {
  const pay = new PayEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);

  // Safety check: fail if project doesn't exist
  if (!project) {
    log.error("[handlePay] Missing project. ID:{}", [projectId]);
    return;
  }

  project.totalPaid = project.totalPaid.plus(event.params.amount);
  project.currentBalance = project.currentBalance.plus(event.params.amount);
  project.save();

  if (pay) {
    pay.cv = cv;
    pay.projectId = event.params.projectId.toI32();
    pay.amount = event.params.amount;
    pay.beneficiary = event.params.beneficiary;
    pay.caller = event.transaction.from;
    pay.project = projectId;
    pay.note = event.params.memo;
    pay.timestamp = event.block.timestamp.toI32();
    pay.txHash = event.transaction.hash;
    pay.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      pay.id,
      cv,
      ProjectEventKey.payEvent
    );

    addToTrendingPayments(projectId, event.params.amount, event.block.timestamp);
  }

  let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (!protocolV2Log) protocolV2Log = newProtocolV2Log();
  if (protocolV2Log) {
    protocolV2Log.volumePaid = protocolV2Log.volumePaid.plus(
      event.params.amount
    );
    protocolV2Log.paymentsCount = protocolV2Log.paymentsCount + 1;
    protocolV2Log.save();
  }
  updateProtocolEntity();

  const participantId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.beneficiary
  );
  let participant = Participant.load(participantId);
  if (!participant) {
    participant = newParticipant(
      cv,
      event.params.projectId,
      event.params.beneficiary
    );
  } else {
    participant.totalPaid = event.params.amount.plus(participant.totalPaid);
  }
  participant.lastPaidTimestamp = event.block.timestamp.toI32();
  participant.save();
}

export function handleRedeemTokens(event: RedeemTokens): void {
  const projectId = idForProject(event.params.projectId, cv);

  const redeemEvent = new RedeemEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  if (redeemEvent) {
    redeemEvent.projectId = event.params.projectId.toI32();
    redeemEvent.cv = cv;
    redeemEvent.amount = event.params.tokenCount;
    redeemEvent.beneficiary = event.params.beneficiary;
    redeemEvent.caller = event.transaction.from;
    redeemEvent.holder = event.params.holder;
    redeemEvent.returnAmount = event.params.reclaimedAmount;
    redeemEvent.project = projectId;
    redeemEvent.timestamp = event.block.timestamp.toI32();
    redeemEvent.txHash = event.transaction.hash;
    redeemEvent.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      redeemEvent.id,
      cv,
      ProjectEventKey.redeemEvent
    );

    let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
    if (!protocolV2Log) protocolV2Log = newProtocolV2Log();
    if (protocolV2Log) {
      protocolV2Log.volumeRedeemed = protocolV2Log.volumeRedeemed.plus(
        event.params.tokenCount
      );
      protocolV2Log.redeemCount = protocolV2Log.redeemCount + 1;
      protocolV2Log.save();
    }
    updateProtocolEntity();
  }

  const project = Project.load(projectId);
  if (!project) {
    log.error("[handleRedeemTokens] Missing project. ID:{}", [projectId]);
    return;
  }
  project.totalRedeemed = project.totalRedeemed.plus(
    event.params.reclaimedAmount
  );
  project.currentBalance = project.currentBalance.minus(
    event.params.reclaimedAmount
  );
  project.save();
}

export function handleUseAllowance(event: UseAllowance): void {
  const projectId = idForProject(event.params.projectId, cv);
  const useAllowanceEvent = new UseAllowanceEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );

  if (!useAllowanceEvent) {
    log.error("[handleUseAllowance] Missing useAllowanceEvent. ID:{}", [
      idForProjectTx(event.params.projectId, cv, event, true),
    ]);
    return;
  }

  useAllowanceEvent.project = projectId;
  useAllowanceEvent.projectId = event.params.projectId.toI32();
  useAllowanceEvent.timestamp = event.block.timestamp.toI32();
  useAllowanceEvent.txHash = event.transaction.hash;
  useAllowanceEvent.amount = event.params.amount;
  useAllowanceEvent.beneficiary = event.params.beneficiary;
  useAllowanceEvent.caller = event.transaction.from;
  useAllowanceEvent.distributedAmount = event.params.distributedAmount;
  useAllowanceEvent.fundingCycleConfiguration =
    event.params.fundingCycleConfiguration;
  useAllowanceEvent.fundingCycleNumber = event.params.fundingCycleNumber.toI32();
  useAllowanceEvent.memo = event.params.memo;
  useAllowanceEvent.netDistributedamount = event.params.netDistributedamount;
  useAllowanceEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    useAllowanceEvent.id,
    cv,
    ProjectEventKey.useAllowanceEvent
  );
}

export function handleProcessFee(event: ProcessFee): void {
  // Load pay event to juicebox project (id: 1)
  // Requires pay event has logIndex preceding that of this tx
  const id = `${idForProjectTx(
    BigInt.fromString("1"),
    cv,
    event
  )}-${event.transactionLogIndex.minus(BigInt.fromString("1"))}`;
  const pay = PayEvent.load(id);
  if (!pay) {
    log.error("[handleProcessFee] Missing PayEvent. ID:{}", [id]);
    return;
  }
  pay.feeFromV2Project = event.params.projectId.toI32();
  pay.save();
}
