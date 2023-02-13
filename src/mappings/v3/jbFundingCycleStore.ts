import { InitEvent } from "../../../generated/schema";
import {
  Configure,
  Init,
} from "../../../generated/V3JBFundingCycleStore/JBFundingCycleStore";
import { ProjectEventKey, PV } from "../../enums";
import { newPV2ConfigureEvent } from "../../utils/entities/configureEvent";
import { saveNewProjectEvent } from "../../utils/entities/projectEvent";
import { idForProject, idForProjectTx } from "../../utils/ids";

const pv = PV.PV2;

export function handleConfigure(event: Configure): void {
  const configureEvent = newPV2ConfigureEvent(
    event,
    event.params.projectId,
    event.params.data.duration,
    event.params.data.weight,
    event.params.data.discountRate,
    event.params.data.ballot,
    event.params.mustStartAtOrAfter,
    event.params.configuration,
    event.params.metadata
  );
  configureEvent.save();

  saveNewProjectEvent(
    event,
    event.params.projectId,
    configureEvent.id,
    pv,
    ProjectEventKey.configureEvent
  );
}

export function handleInit(event: Init): void {
  const initEvent = new InitEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );
  const projectId = idForProject(event.params.projectId, pv);

  if (initEvent) {
    initEvent.projectId = event.params.projectId.toI32();
    initEvent.project = projectId;
    initEvent.timestamp = event.block.timestamp.toI32();
    initEvent.txHash = event.transaction.hash;
    initEvent.caller = event.transaction.from;

    initEvent.configuration = event.params.configuration.toI32();
    initEvent.basedOn = event.params.basedOn.toI32();

    initEvent.save();

    saveNewProjectEvent(
      event,
      event.params.projectId,
      initEvent.id,
      pv,
      ProjectEventKey.initEvent
    );
  }
}
