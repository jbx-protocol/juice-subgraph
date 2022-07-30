import { DeployVeNft } from "../../../generated/JBVeNftDeployer/JBVeNftDeployer";
import { Project, DeployedVeNftEvent } from "../../../generated/schema";
import { idForProject, idForProjectTx } from "../../utils";

export function handleDeployVeNft(event: DeployVeNft): void {
  let cv = "2";
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  let deployedVeNftEvent = new DeployedVeNftEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (deployedVeNftEvent) {
    deployedVeNftEvent.project = project.id;
    deployedVeNftEvent.projectId = project.projectId;
    deployedVeNftEvent.symbol = event.params.symbol;
    deployedVeNftEvent.timestamp = event.block.timestamp.toI32();
    deployedVeNftEvent.txHash = event.transaction.hash;
    deployedVeNftEvent.address = event.address;
    deployedVeNftEvent.save();
  }
}
