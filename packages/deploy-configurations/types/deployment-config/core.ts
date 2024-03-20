import { SystemConfigEntry } from './config-entries'

export type USwapContract = 'uSwap'
export type CoreMainnetOnly = 'ChainLogView'
export type Core =
  | 'ServiceRegistry'
  | 'OperationExecutor'
  | 'OperationStorage'
  | 'OperationsRegistry'
  | 'DSProxyFactory'
  | 'DSProxyRegistry'
  | 'DSGuardFactory'
  | 'AccountGuard'
  | 'AccountFactory'
  | 'Swap'
  | 'ERC20ProxyActions'

export type CoreContracts = Record<Core, SystemConfigEntry>
export type CoreMainnetOnlyContracts = Partial<Record<CoreMainnetOnly, SystemConfigEntry>>
export type OptionalUSwapContract = Partial<Record<USwapContract, SystemConfigEntry>>
