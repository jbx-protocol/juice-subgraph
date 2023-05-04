import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Project,
  ProjectCreateEvent,
  ProtocolLog,
  ProtocolV1Log,
  ProtocolV2Log,
} from "../../../generated/schema";
import { PROTOCOL_ID } from "../../constants";
import { ProjectEventKey, PV } from "../../enums";
import { saveNewProjectEvent } from "../entities/projectEvent";
import {
  newProtocolLog,
  newProtocolV1Log,
  newProtocolV2Log,
  updateProtocolEntity,
} from "../entities/protocolLog";
import { idForProject, idForProjectTx } from "../ids";

export function handleProjectCreate(
  event: ethereum.Event,
  projectId: BigInt,
  pv: PV,
  owner: Address,
  caller: Address,
  metadataUri: string,
  metadataDomain: BigInt | null = null,
  handle: string | null = null
): void {
  const idOfProject = idForProject(projectId, pv);
  const project = new Project(idOfProject);
  if (!project) {
    log.error("[handleCreate] Missing project. ID:{}", [
      idForProject(projectId, pv),
    ]);
    return;
  }
  project.projectId = projectId.toI32();
  project.pv = pv.toString();
  project.trendingScore = BigInt.fromString("0");
  project.trendingVolume = BigInt.fromString("0");
  project.trendingPaymentsCount = BigInt.fromString("0").toI32();
  project.createdWithinTrendingWindow = true;
  project.owner = owner;
  project.deployer = caller;
  project.createdAt = event.block.timestamp.toI32();
  project.metadataUri = metadataUri;
  project.metadataDomain = metadataDomain;
  project.volume = BigInt.fromString("0");
  project.volumeUSD = BigInt.fromString("0");
  project.redeemVolume = BigInt.fromString("0");
  project.redeemVolumeUSD = BigInt.fromString("0");
  project.currentBalance = BigInt.fromString("0");
  project.paymentsCount = 0;
  project.contributorsCount = 0;
  project.redeemCount = 0;
  project.nftsMintedCount = 0;
  project.handle = handle;
  project.save();

  const projectCreateEvent = new ProjectCreateEvent(
    idForProjectTx(projectId, pv, event)
  );
  projectCreateEvent.pv = pv.toString();
  projectCreateEvent.project = project.id;
  projectCreateEvent.projectId = projectId.toI32();
  projectCreateEvent.timestamp = event.block.timestamp.toI32();
  projectCreateEvent.txHash = event.transaction.hash;
  projectCreateEvent.caller = caller;
  projectCreateEvent.from = event.transaction.from;
  projectCreateEvent.save();

  saveNewProjectEvent(
    event,
    projectId,
    projectCreateEvent.id,
    pv,
    ProjectEventKey.projectCreateEvent,
  );

  /**
   * We only need to create any ProtocolLog once since there will only
   * ever be one entity. We might as well do it here when the first
   * project is created.
   */

  if (!ProtocolLog.load(PROTOCOL_ID)) {
    const protocolLog = newProtocolLog();
    protocolLog.save();
  }

  if (pv === PV.PV1) {
    let protocolV1Log = ProtocolV1Log.load(PROTOCOL_ID);
    if (!protocolV1Log) protocolV1Log = newProtocolV1Log();
    protocolV1Log.projectsCount = protocolV1Log.projectsCount + 1;
    protocolV1Log.save();
  }

  if (pv === PV.PV2) {
    let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
    if (!protocolV2Log) protocolV2Log = newProtocolV2Log();

    protocolV2Log.projectsCount = protocolV2Log.projectsCount + 1;
    protocolV2Log.save();
  }

  updateProtocolEntity();
}
