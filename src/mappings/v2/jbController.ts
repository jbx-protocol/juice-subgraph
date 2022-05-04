import {
  DistributeReservedTokens,
  DistributeToReservedTokenSplit,
  MintTokens,
} from "../../../generated/JBController/JBController";
import {
  DistributeReservedTokensEvent,
  DistributeToReservedTokenSplitEvent,
  MintTokensEvent,
} from "../../../generated/schema";
import { CV, ProjectEventKey } from "../../types";
import { idForProject, saveNewProjectEvent } from "../../utils";

const cv: CV = "2";

export function handleMintTokens(event: MintTokens): void {
  // Note: Receiver balance is updated in the jbTokenStore event handler

  let mintTokensEvent = new MintTokensEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  let projectId = idForProject(event.params.projectId, cv);
  if (!mintTokensEvent) return;
  mintTokensEvent.projectId = event.params.projectId.toI32();
  mintTokensEvent.amount = event.params.tokenCount;
  mintTokensEvent.beneficiary = event.params.beneficiary;
  mintTokensEvent.caller = event.params.caller;
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

export function handleDistributeReservedTokens(
  event: DistributeReservedTokens
): void {
  let projectId = idForProject(event.params.projectId, cv);
  let distributeReservedTokensEvent = new DistributeReservedTokensEvent(
    projectId + "-" + event.transaction.hash.toHexString()
  );

  if (!distributeReservedTokensEvent) return;
  distributeReservedTokensEvent.project = projectId;
  distributeReservedTokensEvent.projectId = event.params.projectId.toI32();
  distributeReservedTokensEvent.txHash = event.transaction.hash;
  distributeReservedTokensEvent.timestamp = event.block.timestamp.toI32();
  distributeReservedTokensEvent.fundingCycleNumber = event.params.fundingCycleNumber.toI32();
  distributeReservedTokensEvent.beneficiary = event.params.beneficiary;
  distributeReservedTokensEvent.tokenCount = event.params.tokenCount;
  distributeReservedTokensEvent.beneficiaryTokenCount =
    event.params.beneficiaryTokenCount;
  distributeReservedTokensEvent.memo = event.params.memo;
  distributeReservedTokensEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    distributeReservedTokensEvent.id,
    cv,
    ProjectEventKey.distributeReservedTokensEvent
  );
}

export function handleDistributeToReservedTokenSplit(
  event: DistributeToReservedTokenSplit
): void {
  let projectId = idForProject(event.params.projectId, cv);
  let distributeReservedTokenSplitEvent = new DistributeToReservedTokenSplitEvent(
    projectId +
      "-" +
      event.transaction.hash.toHexString() +
      "-" +
      event.logIndex.toString()
  );

  if (!distributeReservedTokenSplitEvent) return;
  distributeReservedTokenSplitEvent.distributeReservedTokensEvent =
    projectId + "-" + event.transaction.hash.toHexString();
  distributeReservedTokenSplitEvent.project = projectId;
  distributeReservedTokenSplitEvent.projectId = event.params.projectId.toI32();
  distributeReservedTokenSplitEvent.txHash = event.transaction.hash;
  distributeReservedTokenSplitEvent.timestamp = event.block.timestamp.toI32();
  distributeReservedTokenSplitEvent.caller = event.params.caller;
  distributeReservedTokenSplitEvent.tokenCount = event.params.tokenCount;
  distributeReservedTokenSplitEvent.allocator = event.params.split.allocator;
  distributeReservedTokenSplitEvent.beneficiary =
    event.params.split.beneficiary;
  distributeReservedTokenSplitEvent.lockedUntil = event.params.split.lockedUntil.toI32();
  distributeReservedTokenSplitEvent.percent = event.params.split.percent.toI32();
  distributeReservedTokenSplitEvent.preferClaimed =
    event.params.split.preferClaimed;
  distributeReservedTokenSplitEvent.splitProjectId = event.params.split.projectId.toI32();
  distributeReservedTokenSplitEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    distributeReservedTokenSplitEvent.id,
    cv,
    ProjectEventKey.distributeToReservedTokenSplitEvent
  );
}
