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
import { PROTOCOL_ID } from "../../constants";
import { address_v1_ticketBooth } from "../../contractAddresses";
import { ProjectEventKey } from "../../types";
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
import { pvForV1Project } from "../../utils/pv";

export function handlePrint(event: Print): void {
  const pv = pvForV1Project(event.params.projectId);
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
  const pv = pvForV1Project(event.params.projectId);
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
  if (!receiver) return;

  receiver.stakedBalance = receiver.stakedBalance.plus(event.params.amount);

  updateParticipantBalance(receiver);

  receiver.save();
}

export function handleUnstake(event: Unstake): void {
  const pv = pvForV1Project(event.params.projectId);
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
  const pv = pvForV1Project(event.params.projectId);
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
  const pv = pvForV1Project(event.params.projectId);
  const participant = Participant.load(
    idForParticipant(event.params.projectId, pv, event.params.holder)
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
  const pv = pvForV1Project(event.params.projectId);
  const projectId = idForProject(event.params.projectId, pv);
  const project = Project.load(projectId);

  if (!project) return;

  const deployedERC20Event = new DeployedERC20Event(
    idForProjectTx(event.params.projectId, pv, event)
  );
  if (deployedERC20Event) {
    deployedERC20Event.project = project.id;
    deployedERC20Event.projectId = project.projectId;
    deployedERC20Event.pv = pv;
    deployedERC20Event.symbol = event.params.symbol;
    deployedERC20Event.timestamp = event.block.timestamp.toI32();
    deployedERC20Event.txHash = event.transaction.hash;
    deployedERC20Event.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      deployedERC20Event.id,
      pv,
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

  if (address_v1_ticketBooth) {
    const ticketBooth = TicketBooth.bind(
      Address.fromString(address_v1_ticketBooth!)
    );
    const ticketsOfCall = ticketBooth.try_ticketsOf(event.params.projectId);
    if (ticketsOfCall.reverted) {
      log.error("ticketsOf reverted, project: {}, ticketBooth: {}", [
        event.params.projectId.toString(),
        address_v1_ticketBooth!,
      ]);
    } else {
      const erc20Context = new DataSourceContext();
      erc20Context.setI32("projectId", event.params.projectId.toI32());
      erc20Context.setString("pv", pv);
      ERC20.createWithContext(ticketsOfCall.value, erc20Context);
    }
  }
}
