import { Bytes, log } from "@graphprotocol/graph-ts";
import {
  DistributeToPayoutModEvent,
  DistributeToTicketModEvent,
  MintTokensEvent,
  Participant,
  PayEvent,
  AddToBalanceEvent,
  PrintReservesEvent,
  Project,
  ProtocolV1Log,
  RedeemEvent,
  TapEvent,
  V1ConfigureEvent,
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
  Configure,
} from "../../../generated/TerminalV1/TerminalV1";
import { PROTOCOL_ID } from "../../constants";
import { ProjectEventKey, Version } from "../../types";
import { pvForV1Project } from "../../utils/pv";
import {
  newParticipant,
  newProtocolV1Log,
  saveNewProjectTerminalEvent,
  updateProtocolEntity,
} from "../../utils/entity";
import {
  idForParticipant,
  idForPayEvent,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";
import { handleTrendingPayment } from "../../utils/trending";
import { address_v1_terminalV1 } from "../../contractAddresses";

const terminal: Bytes = Bytes.fromHexString(address_v1_terminalV1!);

export function handlePay(event: Pay): void {
  const pv = pvForV1Project(event.params.projectId);
  const pay = new PayEvent(idForPayEvent());
  const projectId = idForProject(event.params.projectId, pv);
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
    pay.pv = pv;
    pay.terminal = terminal;
    pay.projectId = event.params.projectId.toI32();
    pay.amount = event.params.amount;
    pay.beneficiary = event.params.beneficiary;
    pay.caller = event.transaction.from;
    pay.project = projectId;
    pay.note = event.params.note;
    pay.timestamp = event.block.timestamp.toI32();
    pay.txHash = event.transaction.hash;
    pay.save();

    saveNewProjectTerminalEvent(
      event,
      event.params.projectId,
      pay.id,
      pv,
      ProjectEventKey.payEvent,
      terminal
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
    pv,
    event.params.beneficiary
  );
  let participant = Participant.load(participantId);
  if (!participant) {
    participant = newParticipant(
      pv,
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
  /**
   * Note: Receiver balance is updated in the ticketBooth event handler.
   *
   * TBH the only reason to do this logic here instead of ticketBooth
   * is to make use of the `memo` field
   */

  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const mintTokensEvent = new MintTokensEvent(
    idForProjectTx(event.params.projectId, pv, event, true)
  );
  if (!mintTokensEvent) return;
  mintTokensEvent.pv = pv;
  mintTokensEvent.projectId = event.params.projectId.toI32();
  mintTokensEvent.amount = event.params.amount;
  mintTokensEvent.beneficiary = event.params.beneficiary;
  mintTokensEvent.caller = event.transaction.from;
  mintTokensEvent.memo = event.params.memo;
  mintTokensEvent.project = projectId;
  mintTokensEvent.timestamp = event.block.timestamp.toI32();
  mintTokensEvent.txHash = event.transaction.hash;
  mintTokensEvent.save();

  saveNewProjectTerminalEvent(
    event,
    event.params.projectId,
    mintTokensEvent.id,
    pv,
    ProjectEventKey.mintTokensEvent,
    terminal
  );
}

export function handleTap(event: Tap): void {
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const tapEvent = new TapEvent(
    idForProjectTx(event.params.projectId, pv, event)
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

    saveNewProjectTerminalEvent(
      event,
      event.params.projectId,
      tapEvent.id,
      pv,
      ProjectEventKey.tapEvent,
      terminal
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
  const pv = pvForV1Project(event.params._projectId);
  const projectId = idForProject(event.params._projectId, pv);

  const redeemEvent = new RedeemEvent(
    idForProjectTx(event.params._projectId, pv, event, true)
  );
  if (redeemEvent) {
    redeemEvent.projectId = event.params._projectId.toI32();
    redeemEvent.pv = pv;
    redeemEvent.terminal = terminal;
    redeemEvent.amount = event.params.amount;
    redeemEvent.beneficiary = event.params.beneficiary;
    redeemEvent.caller = event.transaction.from;
    redeemEvent.holder = event.params.holder;
    redeemEvent.returnAmount = event.params.returnAmount;
    redeemEvent.project = projectId;
    redeemEvent.timestamp = event.block.timestamp.toI32();
    redeemEvent.txHash = event.transaction.hash;
    redeemEvent.save();

    saveNewProjectTerminalEvent(
      event,
      event.params._projectId,
      redeemEvent.id,
      pv,
      ProjectEventKey.redeemEvent,
      terminal
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
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const printReserveEvent = new PrintReservesEvent(
    idForProjectTx(event.params.projectId, pv, event)
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

  saveNewProjectTerminalEvent(
    event,
    event.params.projectId,
    printReserveEvent.id,
    pv,
    ProjectEventKey.printReservesEvent,
    terminal
  );
}

export function handleAddToBalance(event: AddToBalance): void {
  const pv = pvForV1Project(event.params.projectId);
  const addToBalance = new AddToBalanceEvent(
    idForProjectTx(event.params.projectId, pv, event, true)
  );
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);

  if (!project) {
    log.error("[handleAddToBalance] Missing project. ID:{}", [
      idForProject(event.params.projectId, pv),
    ]);
    return;
  }

  project.currentBalance = project.currentBalance.plus(event.params.value);
  project.save();

  if (addToBalance) {
    addToBalance.pv = pv;
    addToBalance.terminal = terminal;
    addToBalance.projectId = event.params.projectId.toI32();
    addToBalance.amount = event.params.value;
    addToBalance.caller = event.transaction.from;
    addToBalance.project = projectId;
    addToBalance.timestamp = event.block.timestamp.toI32();
    addToBalance.txHash = event.transaction.hash;
    addToBalance.save();

    saveNewProjectTerminalEvent(
      event,
      event.params.projectId,
      addToBalance.id,
      pv,
      ProjectEventKey.addToBalanceEvent,
      terminal
    );
  }
}

export function handleDistributeToPayoutMod(
  event: DistributeToPayoutMod
): void {
  const pv = pvForV1Project(event.params.projectId);
  const distributeToPayoutModEvent = new DistributeToPayoutModEvent(
    idForProjectTx(event.params.projectId, pv, event, true)
  );
  const projectId = idForProject(event.params.projectId, pv);
  if (!distributeToPayoutModEvent) return;
  distributeToPayoutModEvent.projectId = event.params.projectId.toI32();
  distributeToPayoutModEvent.tapEvent = idForProjectTx(
    event.params.projectId,
    pv,
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

  saveNewProjectTerminalEvent(
    event,
    event.params.projectId,
    distributeToPayoutModEvent.id,
    pv,
    ProjectEventKey.distributeToPayoutModEvent,
    terminal
  );
}

export function handleDistributeToTicketMod(
  event: DistributeToTicketMod
): void {
  const pv = pvForV1Project(event.params.projectId);
  const distributeToTicketModEvent = new DistributeToTicketModEvent(
    idForProjectTx(event.params.projectId, pv, event, true)
  );
  const projectId = idForProject(event.params.projectId, pv);

  if (!distributeToTicketModEvent) return;
  distributeToTicketModEvent.printReservesEvent = idForProjectTx(
    event.params.projectId,
    pv,
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

  saveNewProjectTerminalEvent(
    event,
    event.params.projectId,
    distributeToTicketModEvent.id,
    pv,
    ProjectEventKey.distributeToTicketModEvent,
    terminal
  );
}

export function handleMigrate(event: Migrate): void {
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);
  if (!project) return;
  project.terminal = event.params.to;
  project.save();
}

export function handleConfigure(event: Configure): void {
  const pv = pvForV1Project(event.params.projectId);
  const v1ConfigureEvent = new V1ConfigureEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );
  const projectId = idForProject(event.params.projectId, pv);

  if(v1ConfigureEvent) {
    v1ConfigureEvent.projectId = event.params.projectId.toI32();
    v1ConfigureEvent.project = projectId;
    v1ConfigureEvent.timestamp = event.block.timestamp.toI32();
    v1ConfigureEvent.txHash = event.transaction.hash;
    v1ConfigureEvent.caller = event.transaction.from;
    // TODO: Check this on Etherscan
    v1ConfigureEvent.fundingCycleId = event.params.fundingCycleId.toI32();
    v1ConfigureEvent.save();

    saveNewProjectTerminalEvent(
      event,
      event.params.projectId,
      v1ConfigureEvent.id,
      pv,
      ProjectEventKey.v1ConfigureEvent,
      terminal
    );
  }
}
