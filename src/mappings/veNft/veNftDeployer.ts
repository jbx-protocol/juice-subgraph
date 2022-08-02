import { DeployVeNft } from "../../../generated/JBVeNftDeployer/JBVeNftDeployer";
import {
  Project,
  DeployVeNftEvent,
  VeNftContract,
} from "../../../generated/schema";
import { idForProject, idForProjectTx, idForVeNftContract } from "../../utils";
import { JBVeNft } from "../../../generated/templates";

export function handleDeployVeNft(event: DeployVeNft): void {
  let cv = "2";
  let projectId = idForProject(event.params.projectId, cv);
  let project = Project.load(projectId);
  if (!project) return;
  let deployVeNftEvent = new DeployVeNftEvent(
    idForProjectTx(event.params.projectId, cv, event)
  );
  if (deployVeNftEvent) {
    deployVeNftEvent.project = project.id;
    deployVeNftEvent.projectId = project.projectId;
    deployVeNftEvent.timestamp = event.block.timestamp.toI32();
    deployVeNftEvent.txHash = event.transaction.hash;
    deployVeNftEvent.save();

    JBVeNft.create(event.params.jbVeNft);
  }
  let veNftContract = new VeNftContract(
    idForVeNftContract(event.params.projectId, event.params.jbVeNft)
  );
  if (veNftContract) {
    veNftContract.address = event.params.jbVeNft;
    veNftContract.symbol = event.params.symbol;
    veNftContract.uriResolver = event.params.uriResolver;
    veNftContract.project = project.id;
    veNftContract.projectId = project.projectId;
    veNftContract.save();
  }
}
