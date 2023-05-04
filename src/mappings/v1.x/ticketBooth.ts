import {
  Address,
  BigInt,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";

import {
  BurnEvent,
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
import { ADDRESS_ZERO, PROTOCOL_ID } from "../../constants";
import { address_v1_ticketBooth } from "../../contractAddresses";
import { ProjectEventKey, PV } from "../../enums";
import {
  newParticipant,
  updateParticipantBalance,
} from "../../utils/entities/participant";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import {
  newProtocolV1Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import {
  idForParticipant,
  idForProject,
  idForProjectTx,
} from "../../utils/ids";

const pv = PV.PV1;

export function handlePrint(event: Print): void {
  const participantId = idForParticipant(
    event.params.projectId,
    pv,
    event.params.holder
  );
  let participant = Participant.load(participantId);

  if (!participant) {
    participant = newParticipant(
      pv,
      event.params.projectId,
      event.params.holder
    );
  }

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
    idForParticipant(event.params.projectId, pv, event.params.holder)
  );
  if (sender) {
    sender.stakedBalance = sender.stakedBalance.minus(event.params.amount);
    updateParticipantBalance(sender);
    sender.save();
  }

  const receiverId = idForParticipant(
    event.params.projectId,
    pv,
    event.params.recipient
  );
  let receiver = Participant.load(receiverId);

  if (!receiver) {
    receiver = newParticipant(
      pv,
      event.params.projectId,
      event.params.recipient
    );
  }

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();

  // Handle burn
  if (event.params.recipient == ADDRESS_ZERO) {
    const burnEvent = new BurnEvent(
      idForProjectTx(event.params.projectId, pv, event)
    );
    burnEvent.holder = event.params.holder;
    burnEvent.project = idForProject(event.params.projectId, pv);
    burnEvent.projectId = event.params.projectId.toI32();
    burnEvent.pv = pv.toString();
    burnEvent.timestamp = event.block.timestamp.toI32();
    burnEvent.txHash = event.transaction.hash;
    burnEvent.amount = event.params.amount;
    burnEvent.stakedAmount = event.params.amount;
    burnEvent.erc20Amount = BigInt.fromString("0");
    burnEvent.caller = event.params.caller;
    burnEvent.from = event.transaction.from;
    burnEvent.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      burnEvent.id,
      pv,
      ProjectEventKey.burnEvent
    );
  }
}

export function handleUnstake(event: Unstake): void {
  const participant = Participant.load(
    idForParticipant(event.params.projectId, pv, event.params.holder)
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
    idForParticipant(event.params.projectId, pv, event.params.holder)
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
    idForParticipant(event.params.projectId, pv, event.params.holder)
  );

  if (!participant) return;

  if (event.params.preferUnstaked) {
    if (!participant.erc20Balance.gt(event.params.amount)) {
      participant.stakedBalance = participant.stakedBalance.minus(
        event.params.amount.minus(participant.erc20Balance)
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
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);

  if (!project) {
    log.error("[handleIssue] Missing project. ID:{}", [projectId]);
    return;
  }

  const deployedERC20Event = new DeployedERC20Event(
    idForProjectTx(event.params.projectId, pv, event)
  );
  deployedERC20Event.project = project.id;
  deployedERC20Event.projectId = project.projectId;
  deployedERC20Event.pv = pv.toString();
  deployedERC20Event.symbol = event.params.symbol;
  deployedERC20Event.timestamp = event.block.timestamp.toI32();
  deployedERC20Event.txHash = event.transaction.hash;
  deployedERC20Event.caller = event.params.caller;
  deployedERC20Event.from = event.transaction.from;
  deployedERC20Event.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    deployedERC20Event.id,
    pv,
    ProjectEventKey.deployedERC20Event
  );

  let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
  if (!protocolV1Log) protocolV1Log = newProtocolV1Log();
  protocolV1Log.erc20Count = protocolV1Log.erc20Count + 1;
  protocolV1Log.save();
  updateProtocolEntity();

  if (address_v1_ticketBooth) {
    const ticketBooth = TicketBooth.bind(
      Address.fromString(address_v1_ticketBooth!)
    );
    const ticketsOfCall = ticketBooth.try_ticketsOf(event.params.projectId);
    if (ticketsOfCall.reverted) {
      log.error(
        "[handleIssue] ticketsOf reverted, project: {}, ticketBooth: {}",
        [event.params.projectId.toString(), address_v1_ticketBooth!]
      );
    } else {
      const erc20Context = new DataSourceContext();
      erc20Context.setI32("projectId", event.params.projectId.toI32());
      erc20Context.setString("pv", pv.toString());
      ERC20.createWithContext(ticketsOfCall.value, erc20Context);
    }
  }
}
