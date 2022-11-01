import { BigInt, log } from "@graphprotocol/graph-ts"
import { Configure, Init } from "../../../generated/V2JBFundingCycleStore/JBFundingCycleStore"
import { ConfigureEvent, InitEvent } from "../../../generated/schema"
import { MAX_REDEMPTION_RATE } from "../../constants";
import { ProjectEventKey, Version } from "../../types";
import { idForProject, idForProjectTx } from "../../utils/ids";
import { saveNewProjectEvent } from "../../utils/entity";

const pv: Version = "2";

export function handleConfigure(event: Configure): void {
  const configureEvent = new ConfigureEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );
  const projectId = idForProject(event.params.projectId, pv);
  const BigIntOne = BigInt.fromString("1");

  if(configureEvent) {
    configureEvent.projectId = event.params.projectId.toI32();
    configureEvent.project = projectId;
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

    saveNewProjectEvent(
      event,
      event.params.projectId,
      configureEvent.id,
      pv,
      ProjectEventKey.configureEvent
    );
  }
}

export function handleInit(event: Init): void {
  const initEvent = new InitEvent(
    idForProjectTx(event.params.projectId, pv, event)
  );
  const projectId = idForProject(event.params.projectId, pv);

  if(initEvent) {
    initEvent.projectId = event.params.projectId.toI32();
    initEvent.project = projectId;
    initEvent.timestamp = event.block.timestamp.toI32();
    // TODO: Check etherscan for init txHash and caller
    initEvent.txHash = event.transaction.hash;
    initEvent.caller = event.transaction.from;

    // TODO: Check etherscan for init configuration and basedOn
    initEvent.configuration = event.params.data.configuration.toI32();
    initEvent.basedOn = event.params.data.basedOn.toI32();

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
