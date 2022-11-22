pragma solidity ^0.8.15;

string constant OPERATION_STORAGE = "OperationStorage";
string constant OPERATION_EXECUTOR = "OperationExecutor";
string constant OPERATIONS_REGISTRY = "OperationsRegistry";
string constant ONE_INCH_AGGREGATOR = "OneInchAggregator";
string constant WETH = "WETH";
string constant DAI = "DAI";
uint256 constant RAY = 10**27;
bytes32 constant NULL = "";

/**
 * @dev We do not include patch versions in contract names to allow
 * for hotfixes of Action contracts
 * and to limit updates to TheGraph
 * if the types encoded in emitted events change then use a minor version and
 * update the ServiceRegistry with a new entry
 * and update TheGraph decoding accordingly
 */
string constant PULL_TOKEN_ACTION = "PullToken_2";
string constant SEND_TOKEN_ACTION = "SendToken_2";
string constant SET_APPROVAL_ACTION = "SetApproval_2";
string constant TAKE_FLASH_LOAN_ACTION = "TakeFlashloan_2";
string constant WRAP_ETH = "WrapEth_2";
string constant UNWRAP_ETH = "UnwrapEth_2";
string constant RETURN_FUNDS_ACTION = "ReturnFunds_2";
string constant PULL_TO_PROXY_ACTION = "PullToProxy_2";

string constant UNISWAP_ROUTER = "UniswapRouter";
string constant SWAP = "Swap";

address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
