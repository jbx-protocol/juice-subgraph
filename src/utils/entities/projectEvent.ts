import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { ProjectEvent } from "../../../generated/schema";
import { ProjectEventKey, Version } from "../../types";
import { idForProject, idForProjectEvent } from "../ids";

/**
 * Differs from next function because terminal prop isn't optional.
 *
 * By only using this function in Terminal contract handlers, we can
 * avoid forgetting to pass the `terminal` arg.
 */
export function saveNewProjectTerminalEvent(
  event: ethereum.Event,
  projectId: BigInt,
  id: string,
  pv: Version,
  key: ProjectEventKey,
  terminal: Bytes
): void {
  saveNewProjectEvent(event, projectId, id, pv, key, terminal);
}

export function saveNewProjectEvent(
  event: ethereum.Event,
  projectId: BigInt,
  id: string,
  pv: Version,
  key: ProjectEventKey,
  terminal: Bytes | null = null
): void {
  let projectEvent = new ProjectEvent(
    idForProjectEvent(
      projectId,
      pv,
      event.transaction.hash,
      event.transactionLogIndex
    )
  );
  if (!projectEvent) return;
  projectEvent.pv = pv;
  if (terminal) projectEvent.terminal = terminal;
  projectEvent.projectId = projectId.toI32();
  projectEvent.timestamp = event.block.timestamp.toI32();
  projectEvent.project = idForProject(projectId, pv);

  switch (key) {
    case ProjectEventKey.deployedERC20Event:
      projectEvent.deployedERC20Event = id;
      break;
    case ProjectEventKey.distributePayoutsEvent:
      projectEvent.distributePayoutsEvent = id;
      break;
    case ProjectEventKey.distributeReservedTokensEvent:
      projectEvent.distributeReservedTokensEvent = id;
      break;
    case ProjectEventKey.distributeToPayoutModEvent:
      projectEvent.distributeToPayoutModEvent = id;
      break;
    case ProjectEventKey.distributeToReservedTokenSplitEvent:
      projectEvent.distributeToReservedTokenSplitEvent = id;
      break;
    case ProjectEventKey.distributeToTicketModEvent:
      projectEvent.distributeToTicketModEvent = id;
      break;
    case ProjectEventKey.mintTokensEvent:
      projectEvent.mintTokensEvent = id;
      break;
    case ProjectEventKey.payEvent:
      projectEvent.payEvent = id;
      break;
    case ProjectEventKey.addToBalanceEvent:
      projectEvent.addToBalanceEvent = id;
      break;
    case ProjectEventKey.printReservesEvent:
      projectEvent.printReservesEvent = id;
      break;
    case ProjectEventKey.projectCreateEvent:
      projectEvent.projectCreateEvent = id;
      break;
    case ProjectEventKey.redeemEvent:
      projectEvent.redeemEvent = id;
      break;
    case ProjectEventKey.tapEvent:
      projectEvent.tapEvent = id;
      break;
    case ProjectEventKey.useAllowanceEvent:
      projectEvent.useAllowanceEvent = id;
      break;
    case ProjectEventKey.deployETHERC20ProjectPayerEvent:
      projectEvent.deployETHERC20ProjectPayerEvent = id;
      break;
    case ProjectEventKey.deployVeNftEvent:
      projectEvent.deployVeNftEvent = id;
      break;
    case ProjectEventKey.configureEvent:
      projectEvent.configureEvent = id;
      break;
    case ProjectEventKey.initEvent:
      projectEvent.initEvent = id;
      break;
    case ProjectEventKey.v1ConfigureEvent:
      projectEvent.v1ConfigureEvent = id;
      break;
    case ProjectEventKey.v1InitEvent:
      projectEvent.v1InitEvent = id;
      break;
  }

  projectEvent.save();
}
