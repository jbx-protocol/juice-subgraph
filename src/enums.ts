export enum PV {
  PV1 = 1,
  PV2 = 2,
}

export enum ProjectEventKey {
  addToBalanceEvent,
  burn,
  configureEvent,
  deployedERC20Event,
  deployETHERC20ProjectPayerEvent,
  distributePayoutsEvent,
  distributeReservedTokensEvent,
  distributeToPayoutModEvent,
  distributeToPayoutSplitEvent,
  distributeToReservedTokenSplitEvent,
  distributeToTicketModEvent,
  initEvent,
  mintTokensEvent,
  payEvent,
  printReservesEvent,
  projectCreateEvent,
  redeemEvent,
  setFundAccessConstraintsEvent,
  tapEvent,
  useAllowanceEvent,
  v1ConfigureEvent,
  v1InitEvent,
}

export enum JB721GovernanceType {
  NONE,
  TIERED,
  GLOBAL,
}
