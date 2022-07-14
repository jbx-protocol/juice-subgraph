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
  Pay,
  PrintReserveTickets,
  PrintTickets,
  Redeem,
  Tap,
} from "../../../generated/TerminalV1_1/TerminalV1_1";
import { ProjectEventKey } from "../../types";
import {
  cvForV1Project,
  idForParticipant,
  idForProject,
  idForProjectTx,
  protocolId,
  saveNewProjectEvent,
  updateProtocolEntity,
} from "../../utils";

export function handlePay(event: Pay): void {
  let cv = cvForV1Project(event.params.projectId);
  let pay = new PayEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);

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
  }

  let protocolLog = ProtocolV1Log.load(protocolId);
  if (!protocolLog) protocolLog = new ProtocolV1Log(protocolId);
  if (protocolLog) {
    protocolLog.volumePaid = protocolLog.volumePaid.plus(event.params.amount);
    protocolLog.paymentsCount = protocolLog.paymentsCount + 1;
    protocolLog.save();
  }
  updateProtocolEntity();

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
  participant.save();
}

export function handlePrintTickets(event: PrintTickets): void {
  // Note: Receiver balance is updated in the ticketBooth event handler

  let cv = cvForV1Project(event.params.projectId);
  let mintTokensEvent = new MintTokensEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  let projectId = idForProject(event.params.projectId, cv);
  if (!mintTokensEvent) return;
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
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let tapEvent = new TapEvent(
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

  let project = Project.load(projectId);
  if (project) {
    project.currentBalance = project.currentBalance
      .minus(event.params.govFeeAmount)
      .minus(event.params.netTransferAmount);
    project.save();
  }
}

export function handleRedeem(event: Redeem): void {
  let cv = cvForV1Project(event.params._projectId);
  let projectId = idForProject(event.params._projectId, cv);

  let redeemEvent = new RedeemEvent(
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

  let protocolLog = ProtocolV1Log.load(protocolId);
  if (!protocolLog) protocolLog = new ProtocolV1Log(protocolId);
  if (protocolLog) {
    protocolLog.volumeRedeemed = protocolLog.volumeRedeemed.plus(
      event.params.amount
    );
    protocolLog.redeemCount = protocolLog.redeemCount + 1;
    protocolLog.save();
  }
  updateProtocolEntity();

  let project = Project.load(projectId);
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
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let printReserveEvent = new PrintReservesEvent(
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
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  project.currentBalance = project.currentBalance.plus(event.params.value);
  project.save();
}

export function handleDistributeToPayoutMod(
  event: DistributeToPayoutMod
): void {
  let cv = cvForV1Project(event.params.projectId);
  let distributeToPayoutModEvent = new DistributeToPayoutModEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  let projectId = idForProject(event.params.projectId, cv);
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
  let cv = cvForV1Project(event.params.projectId);
  let distributeToTicketModEvent = new DistributeToTicketModEvent(
    idForProjectTx(event.params.projectId, cv, event, true)
  );
  let projectId = idForProject(event.params.projectId, cv);

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

// export function handleAllowMigration(event: AllowMigration): void {}

// export function handleDeposit(event: Deposit): void {}

// export function handleEnsureTargetLocalWei(event: EnsureTargetLocalWei): void {}

// export function handleMigrate(event: Migrate): void {}

// export function handleSetFee(event: SetFee): void {}

// export function handleSetTargetLocalWei(event: SetTargetLocalWei): void {}

// export function handleSetYielder(event: SetYielder): void {}

// export function handleAcceptGovernance(event: AcceptGovernance): void {
//   // Entities can be loaded from the store using a string ID; this ID
//   // needs to be unique across all entities of the same type
//   let entity = ExampleEntity.load(event.transaction.from.toHex())

//   // Entities only exist after they have been saved to the store;
//   // `null` checks allow to create entities on demand
//   if (entity == null) {
//     entity = new ExampleEntity(event.transaction.from.toHex())

//     // Entity fields can be set using simple assignments
//     entity.count = BigInt.fromI32(0)
//   }

//   // BigInt and BigDecimal math are supported
//   entity.count = entity.count + BigInt.fromI32(1)

//   // Entity fields can be set based on event parameters
//   entity.governance = event.params.governance

//   // Entities can be written to the store with `.save()`
//   entity.save()

//   // Note: If a handler doesn't require existing field values, it is faster
//   // _not_ to load the entity from the store. Instead, create it fresh with
//   // `new Entity(...)`, set the fields that should be updated and save the
//   // entity back to the store. Fields that were not set or unset remain
//   // unchanged, allowing for partial updates to be applied.

//   // It is also possible to access smart contracts from mappings. For
//   // example, the contract that has emitted the event can be connected to
//   // with:
//   //
//   // let contract = Contract.bind(event.address)
//   //
//   // The following functions can then be called on this contract to access
//   // state variables and other data:
//   //
//   // - contract.balanceOf(...)
//   // - contract.canPrintPreminedTickets(...)
//   // - contract.claimableOverflowOf(...)
//   // - contract.configure(...)
//   // - contract.currentOverflowOf(...)
//   // - contract.fee(...)
//   // - contract.fundingCycles(...)
//   // - contract.governance(...)
//   // - contract.migrationIsAllowed(...)
//   // - contract.modStore(...)
//   // - contract.operatorStore(...)
//   // - contract.pendingGovernance(...)
//   // - contract.prices(...)
//   // - contract.printReservedTickets(...)
//   // - contract.projects(...)
//   // - contract.redeem(...)
//   // - contract.reservedTicketBalanceOf(...)
//   // - contract.tap(...)
//   // - contract.terminalDirectory(...)
//   // - contract.ticketBooth(...)
// }
