import {
  Address,
  BigInt,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";

import { JB721Delegate as JB721DelegateContract } from "../../generated/templates/JB721Delegate/JB721Delegate";
import { JBController } from "../../generated/JBController/JBController";
import { JB721Delegate, Project } from "../../generated/schema";
import { JB721Delegate as JB721DelegateTemplate } from "../../generated/templates";
import { jb721DelegateType } from "../constants";
import { address_jbController } from "../contractAddresses";
import { CV } from "../types";
import { idForProject } from "../utils/ids";

const cv: CV = "2";

export function updateJb721DelegateForProject(projectId: BigInt): void {
  const controller = JBController.bind(
    Address.fromString(address_jbController)
  );
  // Check dataSource of CURRENT funding cycle
  const fundingCycleCall = controller.try_currentFundingCycleOf(projectId);
  if (fundingCycleCall.reverted) {
    log.error(
      "[updateJb721DelegateForProject] currentFundingCycleOf() reverted for projectId:{}",
      [projectId.toString()]
    );
    return;
  }
  const dataSourceAddress = fundingCycleCall.value.value1.dataSource;

  // Return if no data source
  if (dataSourceAddress == Address.empty()) return;

  // Check if dataSource supports JB721Delegate interface
  const jb721DelegateContract = JB721DelegateContract.bind(dataSourceAddress);
  const supportsInterfaceCall = jb721DelegateContract.try_supportsInterface(
    jb721DelegateType
  );
  // Reverted does not indicate an error
  if (supportsInterfaceCall.reverted || !supportsInterfaceCall.value) return;

  const project = Project.load(idForProject(projectId, cv));

  // Return if project not found
  if (!project) {
    log.error("[updateJb721DelegateForProject] Missing project:{}", [
      projectId.toString(),
    ]);
    return;
  }

  // If project already using a different JB721Delegate, unset its project properties
  if (
    project.jb721Delegate &&
    project.jb721Delegate !== dataSourceAddress.toHexString()
  ) {
    const prevJb721Delegate = JB721Delegate.load(
      project.jb721Delegate as string
    );
    if (prevJb721Delegate) {
      prevJb721Delegate.projectId = 0;
      prevJb721Delegate.project = "";
      prevJb721Delegate.save();
    }
  }

  // Create data source context. Required to listen to token transfers
  const context = new DataSourceContext();
  context.setBytes("address", dataSourceAddress);
  JB721DelegateTemplate.createWithContext(dataSourceAddress, context);

  // Create JB721Delegate entity. Required to query project JB721Delegates
  let jb721Delegate = JB721Delegate.load(dataSourceAddress.toHexString());
  if (!jb721Delegate) {
    // Create jb721Delegate entity using data from contract calls
    const nameCall = jb721DelegateContract.try_name();
    const symbolCall = jb721DelegateContract.try_symbol();
    const directoryCall = jb721DelegateContract.try_directory();
    if (nameCall.reverted || symbolCall.reverted || directoryCall.reverted) {
      log.error(
        "[updateJb721DelegateForProject] Call reverted for jb721Delegate with address: {}. name():{}, symbol():{}, directory():{}",
        [
          dataSourceAddress.toHexString(),
          nameCall.reverted ? "reverted" : "ok",
          symbolCall.reverted ? "reverted" : "ok",
          directoryCall.reverted ? "reverted" : "ok",
        ]
      );
      return;
    }
    jb721Delegate = new JB721Delegate(dataSourceAddress.toHexString());
    jb721Delegate.name = nameCall.value;
    jb721Delegate.symbol = symbolCall.value;
    jb721Delegate.directory = directoryCall.value;
    jb721Delegate.address = dataSourceAddress;
  }
  // Even if jb721Delegate entity already exists, we set the project properties just in case the contract is now a data source for a new project
  if (jb721Delegate.project !== project.id) {
    jb721Delegate.project = project.id;
    jb721Delegate.projectId = project.projectId;
  }
  jb721Delegate.save();
}
