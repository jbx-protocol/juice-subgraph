export enum PV {
  PV1 = 1,
  PV2 = 2,
}

export enum ProjectEventKey {
  deployedERC20Event,
  distributeReservedTokensEvent,
  distributeToPayoutModEvent,
  distributeToReservedTokenSplitEvent,
  distributeToPayoutSplitEvent,
  distributeToTicketModEvent,
  mintTokensEvent,
  payEvent,
  addToBalanceEvent,
  printReservesEvent,
  projectCreateEvent,
  tapEvent,
  distributePayoutsEvent,
  redeemEvent,
  useAllowanceEvent,
  deployETHERC20ProjectPayerEvent,
  configureEvent,
  initEvent,
  v1ConfigureEvent,
  v1InitEvent,
  burn
}

export enum JB721GovernanceType {
  NONE,
  TIERED,
  GLOBAL
}
