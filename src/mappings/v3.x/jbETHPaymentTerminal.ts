import { Bytes } from "@graphprotocol/graph-ts";

import { ProtocolV3Log } from "../../../generated/schema";
import {
  AddToBalance,
  DistributePayouts,
  DistributeToPayoutSplit,
  Pay,
  ProcessFee,
  RedeemTokens,
  UseAllowance,
} from "../../../generated/JBETHPaymentTerminal3/JBETHPaymentTerminal3";
import { PROTOCOL_ID } from "../../constants";
import { address_v3_jbETHPaymentTerminal } from "../../contractAddresses";
import {
  newProtocolV3Log,
  updateProtocolEntity,
} from "../../utils/entities/protocolLog";
import { v3USDPriceForEth } from "../../utils/prices/v3Prices";
import { handleV2V3AddToBalance } from "../../utils/v2v3/ethPaymentTerminal.ts/addToBalance";
import { handleV2V3DistributePayouts } from "../../utils/v2v3/ethPaymentTerminal.ts/distributePayouts";
import { handleV2V3DistributeToPayoutSplit } from "../../utils/v2v3/ethPaymentTerminal.ts/distributeToPayoutSplit";
import { handleV2V3Pay } from "../../utils/v2v3/ethPaymentTerminal.ts/pay";
import { handleV2V3ProcessFee } from "../../utils/v2v3/ethPaymentTerminal.ts/processFee";
import { handleV2V3RedeemTokens } from "../../utils/v2v3/ethPaymentTerminal.ts/redeemTokens";
import { handleV2V3UseAllowance } from "../../utils/v2v3/ethPaymentTerminal.ts/useAllowance";

const terminal: Bytes = Bytes.fromHexString(address_v3_jbETHPaymentTerminal!);

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
    v3USDPriceForEth(event.params.beneficiaryDistributionAmount),
    event.params.distributedAmount,
    v3USDPriceForEth(event.params.distributedAmount),
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
    v3USDPriceForEth(event.params.amount),
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
  const amountUSD = v3USDPriceForEth(event.params.amount);

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

  let protocolV3Log = ProtocolV3Log.load(PROTOCOL_ID);
  if (!protocolV3Log) protocolV3Log = newProtocolV3Log();
  protocolV3Log.volume = protocolV3Log.volume.plus(event.params.amount);
  if (amountUSD) {
    protocolV3Log.volumeUSD = protocolV3Log.volumeUSD.plus(amountUSD);
  }
  protocolV3Log.paymentsCount = protocolV3Log.paymentsCount + 1;
  protocolV3Log.save();
  updateProtocolEntity();
}

export function handleRedeemTokens(event: RedeemTokens): void {
  const reclaimedAmountUSD = v3USDPriceForEth(event.params.reclaimedAmount);

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

  let protocolV3Log = ProtocolV3Log.load(PROTOCOL_ID);
  if (!protocolV3Log) protocolV3Log = newProtocolV3Log();
  protocolV3Log.volumeRedeemed = protocolV3Log.volumeRedeemed.plus(
    event.params.reclaimedAmount
  );
  if (reclaimedAmountUSD) {
    protocolV3Log.volumeRedeemedUSD = protocolV3Log.volumeRedeemedUSD.plus(
      reclaimedAmountUSD
    );
  }
  protocolV3Log.redeemCount = protocolV3Log.redeemCount + 1;
  protocolV3Log.save();
  updateProtocolEntity();
}

export function handleUseAllowance(event: UseAllowance): void {
  const amountUSD = v3USDPriceForEth(event.params.amount);
  const distributedAmountUSD = v3USDPriceForEth(event.params.distributedAmount);
  const netDistributedamountUSD = v3USDPriceForEth(
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
