import { Configure } from "../../../generated/JBFundingCycleStore/JBFundingCycleStore";
import { updateJb721DelegateForProject } from "../../utils/jb721Delegate";

export function handleConfigure(event: Configure): void {
  updateJb721DelegateForProject(event.params.projectId);
}
