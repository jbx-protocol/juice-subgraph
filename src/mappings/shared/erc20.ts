import { BigInt, dataSource } from "@graphprotocol/graph-ts";

import { BurnEvent, Participant } from "../../../generated/schema";
import { Transfer } from "../../../generated/templates/ERC20/ERC20";
import { ADDRESS_ZERO } from "../../constants";
import { ProjectEventKey, PV } from "../../enums";
import {
  newParticipant,
  updateParticipantBalance,
} from "../../utils/entities/participant";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import { idForParticipant, idForProjectTx } from "../../utils/ids";

export function handleERC20Transfer(event: Transfer): void {
  const context = dataSource.context();
  const projectId = BigInt.fromI32(context.getI32("projectId"));
  const pv = context.getString("pv") == "1" ? PV.PV1 : PV.PV2;

  let sender = Participant.load(
    idForParticipant(projectId, pv, event.params.from)
  );

  if (sender) {
    sender.unstakedBalance = sender.unstakedBalance.minus(event.params.value);

    updateParticipantBalance(sender);

    sender.save();
  }

  const receiverId = idForParticipant(projectId, pv, event.params.to);
  let receiver = Participant.load(receiverId);
  if (!receiver) receiver = newParticipant(pv, projectId, event.params.to);

  receiver.unstakedBalance = receiver.unstakedBalance.plus(event.params.value);

  updateParticipantBalance(receiver);

  receiver.save();

  if (event.params.to == ADDRESS_ZERO && pv == PV.PV1) {
    const _projectId = idForProjectTx(projectId, pv, event);
    const burnEvent = new BurnEvent(_projectId);
    burnEvent.projectId = projectId.toI32();
    burnEvent.project = _projectId;
    burnEvent.holder = event.params.from;
    burnEvent.pv = pv.toString();
    burnEvent.amount = event.params.value;
    burnEvent.stakedAmount = BigInt.fromString("0");
    burnEvent.unstakedAmount = event.params.value;
    burnEvent.save();

    saveNewProjectEvent(
      event,
      projectId,
      burnEvent.id,
      pv,
      ProjectEventKey.burn
    );
  }
}
