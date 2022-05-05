import {
  Address,
  BigInt,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";

import {
  DeployedERC20Event,
  Participant,
  Project,
  ProtocolV1Log,
} from "../../../generated/schema";
import {
  Issue,
  Print,
  Redeem,
  Stake,
  TicketBooth,
  Transfer,
  Unstake,
} from "../../../generated/TicketBooth/TicketBooth";
import { CV, ProjectEventKey } from "../../types";
import { ERC20 } from "../../../generated/templates";
import { address_ticketBooth } from "../../contractAddresses";
import {
  cvForV1Project,
  idForParticipant,
  idForProject,
  protocolId,
  saveNewProjectEvent,
  updateBalance,
  updateProtocolEntity,
} from "../../utils";

export function handlePrint(event: Print): void {
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let id = idForParticipant(event.params.projectId, cv, event.params.holder);
  let participant = Participant.load(id);
  let project = Project.load(projectId);

  if (!project) return;

  if (!participant) {
    participant = new Participant(id);
    participant.project = project.id;
    participant.cv = cv;
    participant.projectId = project.projectId;
    participant.stakedBalance = BigInt.fromString("0");
    participant.unstakedBalance = BigInt.fromString("0");
    participant.wallet = event.params.holder;
    participant.totalPaid = BigInt.fromString("0");
    participant.lastPaidTimestamp = 0;
  }

  if (!participant) return;

  if (!event.params.preferUnstakedTickets) {
    participant.stakedBalance = participant.stakedBalance.plus(
      event.params.amount
    );
  }

  updateBalance(participant);

  participant.save();
}

export function handleTicketTransfer(event: Transfer): void {
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);

  if (!project) return;

  let sender = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);

    updateBalance(sender);

    sender.save();
  }

  let receiverId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.recipient
  );

  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = new Participant(receiverId);
    receiver.project = project.id;
    receiver.cv = cv;
    receiver.projectId = project.projectId;
    receiver.wallet = event.params.recipient;
    receiver.stakedBalance = BigInt.fromString("0");
    receiver.unstakedBalance = BigInt.fromString("0");
    receiver.totalPaid = BigInt.fromString("0");
    receiver.lastPaidTimestamp = 0;
  }

  if (!receiver) return;

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateBalance(receiver);

  receiver.save();
}

export function handleUnstake(event: Unstake): void {
  let cv = cvForV1Project(event.params.projectId);
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.minus(
      event.params.amount
    );

    updateBalance(participant);

    participant.save();
  }
}

export function handleStake(event: Stake): void {
  let cv = cvForV1Project(event.params.projectId);
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (participant) {
    participant.stakedBalance = participant.stakedBalance.plus(
      event.params.amount
    );

    updateBalance(participant);

    participant.save();
  }
}

export function handleRedeem(event: Redeem): void {
  let cv = cvForV1Project(event.params.projectId);
  let participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (!participant) return;

  if (event.params.preferUnstaked) {
    if (!participant.unstakedBalance.gt(event.params.amount)) {
      participant.stakedBalance = participant.stakedBalance.minus(
        event.params.amount.minus(participant.unstakedBalance)
      );
    }
  } else {
    if (participant.stakedBalance.gt(event.params.amount)) {
      participant.stakedBalance = participant.stakedBalance.minus(
        event.params.amount
      );
    } else {
      participant.stakedBalance = BigInt.fromString("0");
    }
  }

  updateBalance(participant);

  participant.save();
}

export function handleIssue(event: Issue): void {
  let cv = cvForV1Project(event.params.projectId);
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);

  if (!project) return;

  let deployedERC20Event = new DeployedERC20Event(
    projectId + "-" + event.params.symbol + "-" + event.block.number.toString()
  );
  if (deployedERC20Event) {
    deployedERC20Event.project = project.id;
    deployedERC20Event.projectId = project.projectId;
    deployedERC20Event.cv = cv;
    deployedERC20Event.symbol = event.params.symbol;
    deployedERC20Event.timestamp = event.block.timestamp.toI32();
    deployedERC20Event.txHash = event.transaction.hash;
    deployedERC20Event.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      deployedERC20Event.id,
      cv,
      ProjectEventKey.deployedERC20Event
    );
  }

  let protocolLog = ProtocolV1Log.load(protocolId);
  if (!protocolLog) protocolLog = new ProtocolV1Log(protocolId);
  protocolLog.erc20Count = protocolLog.erc20Count + 1;
  protocolLog.save();
  updateProtocolEntity();

  log.debug("TicketBooth address {}", [address_ticketBooth]);
  let ticketBooth = TicketBooth.bind(Address.fromString(address_ticketBooth));
  let callResult = ticketBooth.try_ticketsOf(event.params.projectId);
  if (callResult.reverted) {
    log.error("ticketsOf reverted, project: {}, ticketBooth: {}", [
      event.params.projectId.toString(),
      address_ticketBooth,
    ]);
  } else {
    let erc20Address = callResult.value;
    let erc20Context = new DataSourceContext();
    erc20Context.setI32("projectId", event.params.projectId.toI32());
    erc20Context.setString("cv", cv);
    ERC20.createWithContext(erc20Address, erc20Context);
  }
}
