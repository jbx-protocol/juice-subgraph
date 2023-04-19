import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  DeployETHERC20ProjectPayerEvent,
  ETHERC20ProjectPayer,
} from "../../../../generated/schema";
import { JBETHERC20ProjectPayer } from "../../../../generated/templates";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { toHexLowercase } from "../../format";
import { idForProject } from "../../ids";

const pv = PV.PV2;

export function handleV2V3DeployProjectPayer(
  event: ethereum.Event,
  projectPayerAddress: Address,
  defaultBeneficiary: Address,
  defaultMemo: string,
  directory: Address,
  defaultMetadata: Bytes,
  owner: Address,
  preferAddToBalance: boolean,
  defaultPreferClaimedTokens: boolean,
  defaultProjectId: BigInt,
  caller: Address
): void {
  JBETHERC20ProjectPayer.create(projectPayerAddress);

  const projectPayer = new ETHERC20ProjectPayer(
    toHexLowercase(projectPayerAddress)
  );
  projectPayer.address = projectPayerAddress;
  projectPayer.beneficiary = defaultBeneficiary;
  projectPayer.directory = directory;
  projectPayer.memo = defaultMemo;
  projectPayer.metadata = defaultMetadata;
  projectPayer.owner = owner;
  projectPayer.preferAddToBalance = preferAddToBalance;
  projectPayer.preferClaimedTokens = defaultPreferClaimedTokens;
  projectPayer.project = idForProject(defaultProjectId, pv);
  projectPayer.projectId = defaultProjectId.toI32();
  projectPayer.save();

  const deployProjectPayerEvent = new DeployETHERC20ProjectPayerEvent(
    toHexLowercase(projectPayer.address)
  );
  deployProjectPayerEvent.address = projectPayer.address;
  deployProjectPayerEvent.beneficiary = projectPayer.beneficiary;
  deployProjectPayerEvent.directory = projectPayer.directory;
  deployProjectPayerEvent.memo = projectPayer.memo;
  deployProjectPayerEvent.metadata = projectPayer.metadata;
  deployProjectPayerEvent.owner = projectPayer.owner;
  deployProjectPayerEvent.preferAddToBalance = projectPayer.preferAddToBalance;
  deployProjectPayerEvent.preferClaimedTokens =
    projectPayer.preferClaimedTokens;
  deployProjectPayerEvent.projectId = projectPayer.projectId;
  deployProjectPayerEvent.project = projectPayer.project;
  deployProjectPayerEvent.timestamp = event.block.timestamp.toI32();
  deployProjectPayerEvent.txHash = event.transaction.hash;
  deployProjectPayerEvent.caller = caller;
  deployProjectPayerEvent.from = event.transaction.from;
  deployProjectPayerEvent.save();
  saveNewProjectEvent(
    event,
    defaultProjectId,
    deployProjectPayerEvent.id,
    pv,
    ProjectEventKey.deployETHERC20ProjectPayerEvent
  );
}
