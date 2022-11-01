export type Version = string;

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
  deployVeNftEvent,
  configureEvent,
  initEvent,
  v1ConfigureEvent,
}
