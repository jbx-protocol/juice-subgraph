import { BigInt, log } from "@graphprotocol/graph-ts"
import {
  JBFundingCycleStore,
  Configure,
  Init
} from "../../../generated/V2JBFundingCycleStore/JBFundingCycleStore"
import { ConfigureEvent, InitEvent } from "../../../generated/schema"
import { MAX_REDEMPTION_RATE } from "../../constants";
import { ProjectEventKey, Version } from "../../types";
import { idForProject, idForProjectTx } from "../../utils/ids";

const pv: Version = "2";

export function handleConfigure(event: Configure): void {
  const project = Project.load(idForProject(event.params.projectId, pv));
  if (!project) {
    log.error("[handleConfigure] Missing project. ID:{}", [
      idForProject(event.params.projectId, pv),
    ]);
    return;
  }

  const contract = Contract.bind(event.address)
  const configureEvent = new ConfigureEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );

  const BigIntOne = BigInt.fromString("1");

  if(configureEvent) {
    configureEvent.projectId = event.params.projectId.toI32();
    configureEvent.pv = pv;
    configureEvent.timestamp = event.block.timestamp.toI32();
    configureEvent.txHash = event.transaction.hash;
    configureEvent.caller = event.transaction.from;

    // From the cycle's JBFundingCycleData
    configureEvent.duration = event.params.data.duration.toI32();
    configureEvent.weight = event.params.data.weight;
    configureEvent.discountRate = event.params.data.discountRate;
    configureEvent.ballot = event.params.data.ballot;

    // Top level
    configureEvent.mustStartAtOrAfter = event.params.mustStartAtOrAfter.toI32();
    configureEvent.configuration = event.params.configuration.toI32();
    configureEvent.metadata = event.params.metadata;

    // Unpacking global metadata. 
    let globalMetadata = u8((event.params.metadata >> 8).toI32());
    configureEvent.setTerminalsAllowed = bool(globalMetadata & 1);
    configureEvent.setControllerAllowed = bool((globalMetadata >> 1) & 1);
    configureEvent.transfersPaused = bool((globalMetadata >> 2) & 1);

    // Unpacking metadata. See github.com/jbx-protocol/juice-contracts-v3/blob/main/contracts/libraries/JBFundingCycleMetadataResolver.sol
    configureEvent.reservedRate = u16((event.params.metadata >> 24).toI32());
    configureEvent.redemptionRate = MAX_REDEMPTION_RATE - u16((event.params.metadata >> 40).toI32());
    configureEvent.ballotRedemptionRate = MAX_REDEMPTION_RATE - u16((event.params.metadata >> 56).toI32());
    configureEvent.payPaused = bool((event.params.metadata >> 72) & BigIntOne);
    configureEvent.distributionsPaused = bool((event.params.metadata >> 73) & BigIntOne);
    configureEvent.redeemPaused = bool((event.params.metadata >> 74) & BigIntOne);
    configureEvent.burnPaused = bool((event.params.metadata >> 75) & BigIntOne);
    configureEvent.mintingAllowed = bool((event.params.metadata >> 76) & BigIntOne);
    configureEvent.terminalMigrationAllowed = bool((event.params.metadata >> 77) & BigIntOne);
    configureEvent.controllerMigrationAllowed = bool((event.params.metadata >> 78) & BigIntOne);
    configureEvent.shouldHoldFees = bool((event.params.metadata >> 79) & BigIntOne);
    configureEvent.preferClaimedTokenOverride = bool((event.params.metadata >> 80) & BigIntOne);
    configureEvent.useTotalOverflowForRedemptions = bool((event.params.metadata >> 81) & BigIntOne);
    configureEvent.useDataSourceForPay = bool((event.params.metadata >> 82) & BigIntOne);
    configureEvent.useDataSourceForRedeem = bool((event.params.metadata >> 83) & BigIntOne);

    let dataSource = ByteArray.fromHexString('0x');
    for(let i=0; i<160; i+=32) {
      dataSource = dataSource.concatI32(event.params.metadata >> (84+i));
    }

    configureEvent.dataSource = dataSource;
    configureEvent.metametadata = u8((event.params.metadata >> 244).toI32());

    configureEvent.save();

    // saveNewProjectEvent(
    //   event,
    //   event.params.projectId,
    //   configureEvent.id,
    //   pv,
    //   ProjectEventKey.configureEvent
    // );
  }
}

export function handleInit(event: Init): void {}
