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
import { ERC20 } from "../../../generated/templates";
import {
  Issue,
  Print,
  Redeem,
  Stake,
  TicketBooth,
  Transfer,
  Unstake,
} from "../../../generated/TicketBooth/TicketBooth";
import { address_ticketBooth } from "../../contractAddresses";
import { CV, ProjectEventKey } from "../../types";
import { PROTOCOL_ID } from "../../constants";
import {
  idForParticipant,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";
import {
  newParticipant,
  newProtocolV1Log,
  saveNewProjectEvent,
  updateParticipantBalance,
  updateProtocolEntity,
} from "../../utils/entity";

const cv: CV = "1";

export function handlePrint(event: Print): void {
  const participantId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.holder
  );
  let participant = Participant.load(participantId);

  if (!participant) {
    participant = newParticipant(
      cv,
      event.params.projectId,
      event.params.holder
    );
  }
  if (!participant) return;

  if (!event.params.preferUnstakedTickets) {
    participant.stakedBalance = participant.stakedBalance.plus(
      event.params.amount
    );
  }

  updateParticipantBalance(participant);

  participant.save();
}

export function handleTicketTransfer(event: Transfer): void {
  const sender = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );
  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);
    updateParticipantBalance(sender);
    sender.save();
  }

  const receiverId = idForParticipant(
    event.params.projectId,
    cv,
    event.params.recipient
  );
  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = newParticipant(
      cv,
      event.params.projectId,
      event.params.recipient
    );
  }
  if (!receiver) return;

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();
}

export function handleUnstake(event: Unstake): void {
  const participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (!participant) return;

  participant.stakedBalance = participant.stakedBalance.minus(
    event.params.amount
  );

  updateParticipantBalance(participant);

  participant.save();
}

export function handleStake(event: Stake): void {
  const participant = Participant.load(
    idForParticipant(event.params.projectId, cv, event.params.holder)
  );

  if (!participant) return;

  participant.stakedBalance = participant.stakedBalance.plus(
    event.params.amount
  );

  updateParticipantBalance(participant);

  participant.save();
}

export function handleRedeem(event: Redeem): void {
  const participant = Participant.load(
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

  updateParticipantBalance(participant);

  participant.save();
}

export function handleIssue(event: Issue): void {
  const projectId = idForProject(event.params.projectId, cv);
  const project = Project.load(projectId);

  if (!project) return;

  const deployedERC20Event = new DeployedERC20Event(
    idForProjectTx(event.params.projectId, cv, event)
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

  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = newProtocolV1Log();
  if (protocolV1Log) {
    protocolV1Log.erc20Count = protocolV1Log.erc20Count + 1;
    protocolV1Log.save();
    updateProtocolEntity();
  }

  const ticketBooth = TicketBooth.bind(Address.fromString(address_ticketBooth));
  const ticketsOfCall = ticketBooth.try_ticketsOf(event.params.projectId);
  if (ticketsOfCall.reverted) {
    log.error("ticketsOf reverted, project: {}, ticketBooth: {}", [
      event.params.projectId.toString(),
      address_ticketBooth,
    ]);
  } else {
    const erc20Context = new DataSourceContext();
    erc20Context.setI32("projectId", event.params.projectId.toI32());
    erc20Context.setString("cv", cv);
    ERC20.createWithContext(ticketsOfCall.value, erc20Context);
  }
}
