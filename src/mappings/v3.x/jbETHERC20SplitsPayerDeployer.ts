import { DeploySplitsPayer } from "../../../generated/JBETHERC20SplitsPayerDeployer3/JBETHERC20SplitsPayerDeployer";
import {
  DeployETHERC20SplitsPayerEvent,
  ETHERC20SplitsPayer,
} from "../../../generated/schema";
import { PV } from "../../enums";
import { idForProjectTx, idForSplitsPayer } from "../../utils/ids";

const pv = PV.PV2;

export function handleDeploySplitsPayer(event: DeploySplitsPayer): void {
  const deploySplitsPayerEvent = new DeployETHERC20SplitsPayerEvent(
    idForProjectTx(event.params.defaultProjectId, pv, event)
  );

  deploySplitsPayerEvent.caller = event.params.caller;
  deploySplitsPayerEvent.defaultBeneficiary = event.params.defaultBeneficiary;
  deploySplitsPayerEvent.defaultMemo = event.params.defaultMemo;
  deploySplitsPayerEvent.defaultMetadata = event.params.defaultMetadata;
  deploySplitsPayerEvent.defaultPreferClaimedTokens =
    event.params.defaultPreferClaimedTokens;
  deploySplitsPayerEvent.defaultProjectId = event.params.defaultProjectId.toI32();
  deploySplitsPayerEvent.defaultSplitsDomain = event.params.defaultSplitsDomain;
  deploySplitsPayerEvent.defaultSplitsGroup = event.params.defaultSplitsGroup;
  deploySplitsPayerEvent.defaultSplitsProjectId = event.params.defaultSplitsProjectId.toI32();
  deploySplitsPayerEvent.owner = event.params.owner;
  deploySplitsPayerEvent.preferAddToBalance = event.params.preferAddToBalance;
  deploySplitsPayerEvent.splitsPayer = event.params.splitsPayer;
  deploySplitsPayerEvent.save();

  const splitPayer = new ETHERC20SplitsPayer(
    idForSplitsPayer(event.params.defaultProjectId, event.params.splitsPayer)
  );
  splitPayer.defaultBeneficiary = event.params.defaultBeneficiary;
  splitPayer.defaultMemo = event.params.defaultMemo;
  splitPayer.defaultMetadata = event.params.defaultMetadata;
  splitPayer.defaultPreferClaimedTokens =
    event.params.defaultPreferClaimedTokens;
  splitPayer.defaultProjectId = event.params.defaultProjectId.toI32();
  splitPayer.defaultSplitsDomain = event.params.defaultSplitsDomain;
  splitPayer.defaultSplitsGroup = event.params.defaultSplitsGroup;
  splitPayer.defaultSplitsProjectId = event.params.defaultSplitsProjectId.toI32();
  splitPayer.owner = event.params.owner;
  splitPayer.preferAddToBalance = event.params.preferAddToBalance;
  splitPayer.splitsPayer = event.params.splitsPayer;
  splitPayer.save();
}
