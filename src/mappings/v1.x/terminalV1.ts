import { log } from "@graphprotocol/graph-ts";
import {
  DistributeToPayoutModEvent,
  DistributeToTicketModEvent,
  MintTokensEvent,
  Participant,
  PayEvent,
  PrintReservesEvent,
  Project,
  ProtocolV1Log,
  RedeemEvent,
  TapEvent,
} from "../../../generated/schema";
import {
  AddToBalance,
  DistributeToPayoutMod,
  DistributeToTicketMod,
  Migrate,
  Pay,
  PrintPreminedTickets,
  PrintReserveTickets,
  Redeem,
  Tap,
} from "../../../generated/TerminalV1/TerminalV1";
import { PROTOCOL_ID } from "../../constants";
import { ProjectEventKey } from "../../types";
import { cvForV1Project } from "../../utils/cv";
import {
  newParticipant,
  newProtocolV1Log,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils/entity";
import {
  idForParticipant,
  idForPayEvent,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";
import { handleTrendingPayment } from "../../utils/trending";

export function handlePay(event: Pay): void {
  const cv = cvForV1Project(event.params.projectId);
  const pay = new PayEvent(idForPayEvent());
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
    pay.note = event.params.note;
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

    handleTrendingPayment(event.block.timestamp);
  }

  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = newProtocolV1Log();
  if (protocolV1Log) {
    protocolV1Log.volumePaid = protocolV1Log.volumePaid.plus(
      event.params.amount
    );
    protocolV1Log.paymentsCount = protocolV1Log.paymentsCount + 1;
    protocolV1Log.save();
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

export function handlePrintPreminedTickets(event: PrintPreminedTickets): void {
  // Note: Receiver balance is updated in the ticketBooth event handler
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const mintTokensEvent = new MintTokensEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  if (!mintTokensEvent) return;
  mintTokensEvent.cv = cv;
  mintTokensEvent.projectId = event.params.projectId.toI32();
  mintTokensEvent.amount = event.params.amount;
  mintTokensEvent.beneficiary = event.params.beneficiary;
  mintTokensEvent.caller = event.transaction.from;
  mintTokensEvent.memo = event.params.memo;
  mintTokensEvent.project = projectId;
  mintTokensEvent.timestamp = event.block.timestamp.toI32();
  mintTokensEvent.txHash = event.transaction.hash;
  mintTokensEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    mintTokensEvent.id,
    cv,
    ProjectEventKey.mintTokensEvent
  );
}

export function handleTap(event: Tap): void {
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const tapEvent = new TapEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (tapEvent) {
    tapEvent.amount = event.params.amount;
    tapEvent.beneficiary = event.params.beneficiary;
    tapEvent.beneficiaryTransferAmount = event.params.beneficiaryTransferAmount;
    tapEvent.caller = event.transaction.from;
    tapEvent.currency = event.params.currency;
    tapEvent.fundingCycleId = event.params.fundingCycleId;
    tapEvent.govFeeAmount = event.params.govFeeAmount;
    tapEvent.netTransferAmount = event.params.netTransferAmount;
    tapEvent.project = projectId;
    tapEvent.projectId = event.params.projectId.toI32();
    tapEvent.timestamp = event.block.timestamp.toI32();
    tapEvent.txHash = event.transaction.hash;
    tapEvent.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      tapEvent.id,
      cv,
      ProjectEventKey.tapEvent
    );
  }

  const project = Project.load(projectId);
  if (project) {
    project.currentBalance = project.currentBalance
      .minus(event.params.govFeeAmount)
      .minus(event.params.netTransferAmount);
    project.save();
  }
}

export function handleRedeem(event: Redeem): void {
  const cv = cvForV1Project(event.params._projectId);
  const projectId = idForProject(event.params._projectId, cv);

  const redeemEvent = new RedeemEvent(
    idForProjectTx(event.params._projectId, cv, event, true)
  );
  if (redeemEvent) {
    redeemEvent.projectId = event.params._projectId.toI32();
    redeemEvent.cv = cv;
    redeemEvent.amount = event.params.amount;
    redeemEvent.beneficiary = event.params.beneficiary;
    redeemEvent.caller = event.transaction.from;
    redeemEvent.holder = event.params.holder;
    redeemEvent.returnAmount = event.params.returnAmount;
    redeemEvent.project = projectId;
    redeemEvent.timestamp = event.block.timestamp.toI32();
    redeemEvent.txHash = event.transaction.hash;
    redeemEvent.save();

    saveNewProjectEvent(
      event,
      event.params._projectId,
      redeemEvent.id,
      cv,
      ProjectEventKey.redeemEvent
    );
  }

  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = new ProtocolV1Log(PROTOCOL_ID);
  if (protocolV1Log) {
    protocolV1Log.volumeRedeemed = protocolV1Log.volumeRedeemed.plus(
      event.params.amount
    );
    protocolV1Log.redeemCount = protocolV1Log.redeemCount + 1;
    protocolV1Log.save();
  }
  updateProtocolEntity();

  const project = Project.load(projectId);
  if (project) {
    project.totalRedeemed = project.totalRedeemed.plus(
      event.params.returnAmount
    );
    project.currentBalance = project.currentBalance.minus(
      event.params.returnAmount
    );
    project.save();
  }
}

export function handlePrintReserveTickets(event: PrintReserveTickets): void {
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const printReserveEvent = new PrintReservesEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (!printReserveEvent) return;
  printReserveEvent.projectId = event.params.projectId.toI32();
  printReserveEvent.beneficiary = event.params.beneficiary;
  printReserveEvent.beneficiaryTicketAmount =
    event.params.beneficiaryTicketAmount;
  printReserveEvent.caller = event.transaction.from;
  printReserveEvent.count = event.params.count;
  printReserveEvent.fundingCycleId = event.params.fundingCycleId;
  printReserveEvent.project = projectId;
  printReserveEvent.timestamp = event.block.timestamp.toI32();
  printReserveEvent.txHash = event.transaction.hash;
  printReserveEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    printReserveEvent.id,
    cv,
    ProjectEventKey.printReservesEvent
  );
}

export function handleAddToBalance(event: AddToBalance): void {
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);
  if (!project) return;
  project.currentBalance = project.currentBalance.plus(event.params.value);
  project.save();
}

export function handleDistributeToPayoutMod(
  event: DistributeToPayoutMod
): void {
  const cv = cvForV1Project(event.params.projectId);
  const distributeToPayoutModEvent = new DistributeToPayoutModEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  const projectId = idForProject(event.params.projectId, cv);
  if (!distributeToPayoutModEvent) return;
  distributeToPayoutModEvent.projectId = event.params.projectId.toI32();
  distributeToPayoutModEvent.tapEvent = idForProjectTx(
    event.params.projectId,
    cv,
    event
  );
  distributeToPayoutModEvent.project = projectId;
  distributeToPayoutModEvent.caller = event.transaction.from;
  distributeToPayoutModEvent.projectId = event.params.projectId.toI32();
  distributeToPayoutModEvent.fundingCycleId = event.params.fundingCycleId;
  distributeToPayoutModEvent.modProjectId = event.params.mod.projectId.toI32();
  distributeToPayoutModEvent.modBeneficiary = event.params.mod.beneficiary;
  distributeToPayoutModEvent.modAllocator = event.params.mod.allocator;
  distributeToPayoutModEvent.modPreferUnstaked =
    event.params.mod.preferUnstaked;
  distributeToPayoutModEvent.modCut = event.params.modCut;
  distributeToPayoutModEvent.timestamp = event.block.timestamp.toI32();
  distributeToPayoutModEvent.txHash = event.transaction.hash;

  distributeToPayoutModEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    distributeToPayoutModEvent.id,
    cv,
    ProjectEventKey.distributeToPayoutModEvent
  );
}

export function handleDistributeToTicketMod(
  event: DistributeToTicketMod
): void {
  const cv = cvForV1Project(event.params.projectId);
  const distributeToTicketModEvent = new DistributeToTicketModEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  const projectId = idForProject(event.params.projectId, cv);

  if (!distributeToTicketModEvent) return;
  distributeToTicketModEvent.printReservesEvent = idForProjectTx(
    event.params.projectId,
    cv,
    event
  );
  distributeToTicketModEvent.caller = event.transaction.from;
  distributeToTicketModEvent.modBeneficiary = event.params.mod.beneficiary;
  distributeToTicketModEvent.modPreferUnstaked =
    event.params.mod.preferUnstaked;
  distributeToTicketModEvent.modCut = event.params.modCut;
  distributeToTicketModEvent.projectId = event.params.projectId.toI32();
  distributeToTicketModEvent.fundingCycleId = event.params.fundingCycleId;
  distributeToTicketModEvent.txHash = event.transaction.hash;
  distributeToTicketModEvent.timestamp = event.block.timestamp.toI32();
  distributeToTicketModEvent.project = projectId;

  distributeToTicketModEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    distributeToTicketModEvent.id,
    cv,
    ProjectEventKey.distributeToTicketModEvent
  );
}

export function handleMigrate(event: Migrate): void {
  const cv = cvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);
  if (!project) return;
  project.terminal = event.params.to;
  project.save();
}
