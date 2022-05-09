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
  DistributePayoutsEvent,
  DistributeToPayoutSplitEvent,
  Participant,
  PayEvent,
  Project,
  ProtocolV2Log,
  RedeemEvent,
  UseAllowanceEvent,
} from "../../../generated/schema";
import { CV, ProjectEventKey } from "../../types";
import {
  idForParticipant,
  idForProject,
  idForProjectTx,
  protocolId,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils";

const cv: CV = "2";

export function handleAddToBalance(event: AddToBalance): void {
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  project.currentBalance = project.currentBalance.plus(event.params.amount);
  project.save();
}

export function handleDistributePayouts(event: DistributePayouts): void {
  let distributePayoutsEvent = new DistributePayoutsEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (!distributePayoutsEvent) return;
  distributePayoutsEvent.projectId - event.params.projectId.toI32();
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
  distributePayoutsEvent.projectId = event.params.projectId.toI32();
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
  let projectId = idForProject(event.params.projectId, cv);
  let distributePayoutSplitEvent = new DistributeToPayoutSplitEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );

  if (!distributePayoutSplitEvent) return;
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
  let pay = new PayEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  let projectId = idForProject(event.params.projectId, cv);
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
  }

  let protocolLog = ProtocolV2Log.load(protocolId);
  if (!protocolLog) protocolLog = new ProtocolV2Log(protocolId);
  if (protocolLog) {
    protocolLog.volumePaid = protocolLog.volumePaid.plus(event.params.amount);
    protocolLog.paymentsCount = protocolLog.paymentsCount + 1;
    protocolLog.save();
  }
  updateProtocolEntity();

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
    participant.cv = cv;
    participant.projectId = project.projectId;
    participant.wallet = event.params.beneficiary;
    participant.totalPaid = event.params.amount;
    participant.project = project.id;
  } else {
    participant.totalPaid = event.params.amount.plus(participant.totalPaid);
  }
  participant.lastPaidTimestamp = event.block.timestamp.toI32();

  project.save();
  participant.save();
}

export function handleRedeemTokens(event: RedeemTokens): void {
  let projectId = idForProject(event.params.projectId, cv);

  let redeemEvent = new RedeemEvent(
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

    let protocolLog = ProtocolV2Log.load(protocolId);
    if (!protocolLog) protocolLog = new ProtocolV2Log(protocolId);
    if (protocolLog) {
      protocolLog.volumeRedeemed = protocolLog.volumeRedeemed.plus(
        event.params.tokenCount
      );
      protocolLog.redeemCount = protocolLog.redeemCount + 1;
      protocolLog.save();
    }
    updateProtocolEntity();
  }

  let project = Project.load(projectId);
  if (project) {
    project.totalRedeemed = project.totalRedeemed.plus(
      event.params.reclaimedAmount
    );
    project.currentBalance = project.currentBalance.minus(
      event.params.reclaimedAmount
    );
    project.save();
  }
}

export function handleUseAllowance(event: UseAllowance): void {
  let projectId = idForProject(event.params.projectId, cv);
  let useAllowanceEvent = new UseAllowanceEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );

  if (!useAllowanceEvent) return;

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

export function handleMigrate(event: Migrate): void {}
