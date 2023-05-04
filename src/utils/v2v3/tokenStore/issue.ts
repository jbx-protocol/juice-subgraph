import {
  Address,
  BigInt,
  DataSourceContext,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { DeployedERC20Event, Project } from "../../../../generated/schema";
import { ERC20 } from "../../../../generated/templates";
import { ProjectEventKey, PV } from "../../../enums";
import { saveNewProjectEvent } from "../../entities/projectEvent";
import { idForProject, idForProjectTx } from "../../ids";

const pv = PV.PV2;

export function handleV2V3Issue(
  event: ethereum.Event,
  projectId: BigInt,
  symbol: string,
  token: Address,
  caller: Address
): void {
  const idOfProject = idForProject(projectId, pv);
  const project = Project.load(idOfProject);

  if (!project) {
    log.error("[handleV2V3Issue] Missing project. ID:{}", [
      idForProject(projectId, pv),
    ]);
    return;
  }

  const deployedERC20Event = new DeployedERC20Event(
    idForProjectTx(projectId, pv, event)
  );
  if (deployedERC20Event) {
    deployedERC20Event.project = project.id;
    deployedERC20Event.projectId = project.projectId;
    deployedERC20Event.pv = pv.toString();
    deployedERC20Event.symbol = symbol;
    deployedERC20Event.address = token;
    deployedERC20Event.timestamp = event.block.timestamp.toI32();
    deployedERC20Event.txHash = event.transaction.hash;
    deployedERC20Event.caller = caller;
    deployedERC20Event.from = event.transaction.from;
    deployedERC20Event.save();

    saveNewProjectEvent(
      event,
      projectId,
      deployedERC20Event.id,
      pv,
      ProjectEventKey.deployedERC20Event
    );
  }

  const erc20Context = new DataSourceContext();
  erc20Context.setI32("projectId", projectId.toI32());
  erc20Context.setString("pv", pv.toString());
  ERC20.createWithContext(token, erc20Context);
}
