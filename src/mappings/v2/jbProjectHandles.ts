import { SetEnsName } from "../../../generated/JBProjectHandles/JBProjectHandles";
import { updateV2ProjectHandle } from "../../utils";

export function handleSetEnsName(event: SetEnsName): void {
  updateV2ProjectHandle(event.params.projectId);
}
