import { Bytes } from "@graphprotocol/graph-ts";

import { ProtocolV2Log } from "../../../generated/schema";
import {
  AddToBalance,
  DistributePayouts,
  DistributeToPayoutSplit,
  Pay,
  ProcessFee,
  RedeemTokens,
  UseAllowance,
} from "../../../generated/JBETHPaymentTerminal2/JBETHPaymentTerminal2";
import { PROTOCOL_ID } from "../../constants";
import { address_v2_jbETHPaymentTerminal } from "../../contractAddresses";
import {
  newProtocolV2Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import { v2USDPriceForEth } from "../../utils/prices/v2Prices";
import { handleV2V3AddToBalance } from "../../utils/v2v3/ethPaymentTerminal.ts/addToBalance";
import { handleV2V3DistributePayouts } from "../../utils/v2v3/ethPaymentTerminal.ts/distributePayouts";
import { handleV2V3DistributeToPayoutSplit } from "../../utils/v2v3/ethPaymentTerminal.ts/distributeToPayoutSplit";
import { handleV2V3Pay } from "../../utils/v2v3/ethPaymentTerminal.ts/pay";
import { handleV2V3ProcessFee } from "../../utils/v2v3/ethPaymentTerminal.ts/processFee";
import { handleV2V3RedeemTokens } from "../../utils/v2v3/ethPaymentTerminal.ts/redeemTokens";
import { handleV2V3UseAllowance } from "../../utils/v2v3/ethPaymentTerminal.ts/useAllowance";

const terminal: Bytes = Bytes.fromHexString(address_v2_jbETHPaymentTerminal!);

export function handleAddToBalance(event: AddToBalance): void {
  handleV2V3AddToBalance(
    event,
    event.params.projectId,
    event.params.amount,
    terminal,
    event.params.memo,
    event.params.caller
  );
}

export function handleDistributePayouts(event: DistributePayouts): void {
  handleV2V3DistributePayouts(
    event,
    event.params.projectId,
    event.params.amount,
    event.params.beneficiary,
    event.params.beneficiaryDistributionAmount,
    v2USDPriceForEth(event.params.beneficiaryDistributionAmount),
    event.params.distributedAmount,
    v2USDPriceForEth(event.params.distributedAmount),
    terminal,
    event.params.caller,
    event.params.fee,
    event.params.fundingCycleConfiguration,
    event.params.fundingCycleNumber,
    event.params.memo
  );
}

export function handleDistributeToPayoutSplit(
  event: DistributeToPayoutSplit
): void {
  handleV2V3DistributeToPayoutSplit(
    event,
    event.params.projectId,
    terminal,
    event.params.amount,
    v2USDPriceForEth(event.params.amount),
    event.params.domain,
    event.params.group,
    event.params.split.projectId,
    event.params.split.allocator,
    event.params.split.beneficiary,
    event.params.split.lockedUntil,
    event.params.split.percent,
    event.params.split.preferClaimed,
    event.params.split.preferAddToBalance,
    event.params.caller
  );
}

export function handlePay(event: Pay): void {
  const amountUSD = v2USDPriceForEth(event.params.amount);

  handleV2V3Pay(
    event,
    event.params.projectId,
    event.params.amount,
    amountUSD,
    terminal,
    event.params.beneficiary,
    event.params.caller,
    event.params.payer,
    event.params.memo
  );

  // Update protocol log
  let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (!protocolV2Log) protocolV2Log = newProtocolV2Log();
  protocolV2Log.volume = protocolV2Log.volume.plus(event.params.amount);
  if (amountUSD) {
    protocolV2Log.volumeUSD = protocolV2Log.volumeUSD.plus(amountUSD);
  }
  protocolV2Log.paymentsCount = protocolV2Log.paymentsCount + 1;
  protocolV2Log.save();
  updateProtocolEntity();
}

export function handleRedeemTokens(event: RedeemTokens): void {
  const reclaimedAmountUSD = v2USDPriceForEth(event.params.reclaimedAmount);

  handleV2V3RedeemTokens(
    event,
    event.params.projectId,
    terminal,
    event.params.tokenCount,
    event.params.beneficiary,
    event.params.reclaimedAmount,
    reclaimedAmountUSD,
    event.params.holder,
    event.params.metadata,
    event.params.memo,
    event.params.caller
  );

  let protocolV2Log = ProtocolV2Log.load(PROTOCOL_ID);
  if (!protocolV2Log) protocolV2Log = newProtocolV2Log();
  protocolV2Log.volumeRedeemed = protocolV2Log.volumeRedeemed.plus(
    event.params.reclaimedAmount
  );
  if (reclaimedAmountUSD) {
    protocolV2Log.volumeRedeemedUSD = protocolV2Log.volumeRedeemedUSD.plus(
      reclaimedAmountUSD
    );
  }
  protocolV2Log.redeemCount = protocolV2Log.redeemCount + 1;
  protocolV2Log.save();
  updateProtocolEntity();
}

export function handleUseAllowance(event: UseAllowance): void {
  const amountUSD = v2USDPriceForEth(event.params.amount);
  const distributedAmountUSD = v2USDPriceForEth(event.params.distributedAmount);
  const netDistributedamountUSD = v2USDPriceForEth(
    event.params.netDistributedamount
  );

  handleV2V3UseAllowance(
    event,
    event.params.projectId,
    event.params.amount,
    amountUSD,
    event.params.distributedAmount,
    distributedAmountUSD,
    event.params.netDistributedamount,
    netDistributedamountUSD,
    event.params.beneficiary,
    event.params.fundingCycleConfiguration,
    event.params.fundingCycleNumber,
    event.params.memo,
    event.params.caller,
    terminal
  );
}

export function handleProcessFee(event: ProcessFee): void {
  handleV2V3ProcessFee(event.params.projectId);
}
