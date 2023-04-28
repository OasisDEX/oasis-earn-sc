export declare const CONTRACT_NAMES: {
    readonly common: {
        readonly PULL_TOKEN: "PullToken_3";
        readonly SEND_TOKEN: "SendToken_4";
        readonly SET_APPROVAL: "SetApproval_3";
        readonly TAKE_A_FLASHLOAN: "TakeFlashloan_3";
        readonly SWAP_ACTION: "SwapAction_3";
        readonly WRAP_ETH: "WrapEth_3";
        readonly UNWRAP_ETH: "UnwrapEth_3";
        readonly RETURN_FUNDS: "ReturnFunds_3";
        readonly POSITION_CREATED: "PositionCreated";
        readonly ACCOUNT_GUARD: "AccountGuard";
        readonly ACCOUNT_FACTORY: "AccountFactory";
        readonly OPERATION_EXECUTOR: "OperationExecutor_2";
        readonly OPERATION_STORAGE: "OperationStorage_2";
        readonly OPERATIONS_REGISTRY: "OperationsRegistry_2";
        readonly CHAINLOG_VIEWER: "ChainLogView";
        readonly ONE_INCH_AGGREGATOR: "OneInchAggregator";
        readonly DS_GUARD_FACTORY: "DSGuardFactory";
        readonly DS_PROXY_REGISTRY: "DSProxyRegistry";
        readonly DS_PROXY_FACTORY: "DSProxyFactory";
        readonly SWAP: "Swap";
        readonly EXCHANGE: "Exchange";
        readonly UNISWAP_ROUTER: "UniswapRouter";
        readonly BALANCER_VAULT: "BalancerVault";
        readonly SERVICE_REGISTRY: "ServiceRegistry";
        readonly WETH: "WETH";
        readonly DAI: "DAI";
        readonly USDC: "USDC";
        readonly STETH: "STETH";
        readonly WSTETH: "WSTETH";
        readonly WBTC: "WBTC";
    };
    readonly aave: {
        readonly v2: {
            readonly DEPOSIT: "AaveDeposit_3";
            readonly WITHDRAW: "AaveWithdraw_3";
            readonly BORROW: "AaveBorrow_3";
            readonly PAYBACK: "AavePayback_3";
            readonly LENDING_POOL: "AaveLendingPool";
            readonly WETH_GATEWAY: "AaveWethGateway";
        };
        readonly v3: {
            readonly DEPOSIT: "AaveV3Deposit";
            readonly WITHDRAW: "AaveV3Withdraw";
            readonly BORROW: "AaveV3Borrow";
            readonly PAYBACK: "AaveV3Payback";
            readonly AAVE_POOL: "AavePool";
            readonly SET_EMODE: "AaveV3SetEMode";
        };
        readonly L2_ENCODER: "AaveL2Encoder";
    };
    readonly maker: {
        readonly DEPOSIT: "MakerDeposit";
        readonly PAYBACK: "MakerPayback";
        readonly WITHDRAW: "MakerWithdraw";
        readonly GENERATE: "MakerGenerate";
        readonly OPEN_VAULT: "MakerOpenVault";
        readonly MCD_VIEW: "McdView";
        readonly FLASH_MINT_MODULE: "McdFlashMintModule";
        readonly MCD_MANAGER: "McdManager";
        readonly MCD_JUG: "McdJug";
        readonly MCD_JOIN_DAI: "McdJoinDai";
        readonly CDP_ALLOW: "CdpAllow";
        readonly CHAINLOG_VIEW: "ChainLogView";
    };
    readonly test: {
        readonly DUMMY_ACTION: "DummyAction";
        readonly DUMMY_OPTIONAL_ACTION: "DummyOptionalAction";
        readonly DUMMY_SWAP: "DummySwap";
        readonly DUMMY_EXCHANGE: "DummyExchange";
        readonly SWAP: "uSwap";
    };
};
export type AllValues<T> = {
    [K in keyof T]: T[K] extends object ? AllValues<T[K]> : T[K];
}[keyof T];
export type ContractNames = AllValues<typeof CONTRACT_NAMES>;
//# sourceMappingURL=contract-names.d.ts.map