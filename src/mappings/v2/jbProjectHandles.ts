import { SetEnsNameParts } from "../../../generated/JBProjectHandles/JBProjectHandles";
import { updateV2ProjectHandle } from "../../utils";

export function handleSetEnsNameParts(event: SetEnsNameParts): void {
  updateV2ProjectHandle(event.params.projectId);
}
