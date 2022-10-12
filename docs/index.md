# Solidity API

## Executable

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### Action

```solidity
event Action(string name, bytes32 returned)
```

_Emitted once an Action has completed execution_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The Action name |
| returned | bytes32 | The value returned by the Action |

## PullToken

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

_Pulls token from a target address to the current calling context_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to PullTokenData struct |
|  | uint8[] |  |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct PullTokenData params)
```

## OPERATION_STORAGE

```solidity
string OPERATION_STORAGE
```

## OPERATION_EXECUTOR

```solidity
string OPERATION_EXECUTOR
```

## OPERATIONS_REGISTRY

```solidity
string OPERATIONS_REGISTRY
```

## ONE_INCH_AGGREGATOR

```solidity
string ONE_INCH_AGGREGATOR
```

## WETH

```solidity
string WETH
```

## DAI

```solidity
string DAI
```

## RAY

```solidity
uint256 RAY
```

## NULL

```solidity
bytes32 NULL
```

## PULL_TOKEN_ACTION

```solidity
string PULL_TOKEN_ACTION
```

## SEND_TOKEN_ACTION

```solidity
string SEND_TOKEN_ACTION
```

## SET_APPROVAL_ACTION

```solidity
string SET_APPROVAL_ACTION
```

## TAKE_FLASH_LOAN_ACTION

```solidity
string TAKE_FLASH_LOAN_ACTION
```

## WRAP_ETH

```solidity
string WRAP_ETH
```

## UNWRAP_ETH

```solidity
string UNWRAP_ETH
```

## RETURN_FUNDS_ACTION

```solidity
string RETURN_FUNDS_ACTION
```

## UNISWAP_ROUTER

```solidity
string UNISWAP_ROUTER
```

## SWAP

```solidity
string SWAP
```

## ETH

```solidity
address ETH
```

## FlashloanData

```solidity
struct FlashloanData {
  uint256 amount;
  bool dsProxyFlashloan;
  struct Call[] calls;
}
```

## PullTokenData

```solidity
struct PullTokenData {
  address asset;
  address from;
  uint256 amount;
}
```

## SendTokenData

```solidity
struct SendTokenData {
  address asset;
  address to;
  uint256 amount;
}
```

## SetApprovalData

```solidity
struct SetApprovalData {
  address asset;
  address delegate;
  uint256 amount;
}
```

## SwapData

```solidity
struct SwapData {
  address fromAsset;
  address toAsset;
  uint256 amount;
  uint256 receiveAtLeast;
  uint256 fee;
  bytes withData;
  bool collectFeeInFromToken;
}
```

## Call

```solidity
struct Call {
  bytes32 targetHash;
  bytes callData;
}
```

## Operation

```solidity
struct Operation {
  uint8 currentAction;
  bytes32[] actions;
}
```

## WrapEthData

```solidity
struct WrapEthData {
  uint256 amount;
}
```

## UnwrapEthData

```solidity
struct UnwrapEthData {
  uint256 amount;
}
```

## ReturnFundsData

```solidity
struct ReturnFundsData {
  address asset;
}
```

## IERC20

### totalSupply

```solidity
function totalSupply() external view returns (uint256 supply)
```

### balanceOf

```solidity
function balanceOf(address _owner) external view returns (uint256 balance)
```

### transfer

```solidity
function transfer(address _to, uint256 _value) external returns (bool success)
```

### transferFrom

```solidity
function transferFrom(address _from, address _to, uint256 _value) external returns (bool success)
```

### approve

```solidity
function approve(address _spender, uint256 _value) external returns (bool success)
```

### allowance

```solidity
function allowance(address _owner, address _spender) external view returns (uint256 remaining)
```

### decimals

```solidity
function decimals() external view returns (uint256 digits)
```

## Address

### isContract

```solidity
function isContract(address account) internal view returns (bool)
```

### sendValue

```solidity
function sendValue(address payable recipient, uint256 amount) internal
```

### functionCall

```solidity
function functionCall(address target, bytes data) internal returns (bytes)
```

### functionCall

```solidity
function functionCall(address target, bytes data, string errorMessage) internal returns (bytes)
```

### functionCallWithValue

```solidity
function functionCallWithValue(address target, bytes data, uint256 value) internal returns (bytes)
```

### functionCallWithValue

```solidity
function functionCallWithValue(address target, bytes data, uint256 value, string errorMessage) internal returns (bytes)
```

### _functionCallWithValue

```solidity
function _functionCallWithValue(address target, bytes data, uint256 weiValue, string errorMessage) private returns (bytes)
```

### functionDelegateCall

```solidity
function functionDelegateCall(address target, bytes data, string errorMessage) internal returns (bytes)
```

## SafeERC20

### safeTransfer

```solidity
function safeTransfer(contract IERC20 token, address to, uint256 value) internal
```

### safeTransferFrom

```solidity
function safeTransferFrom(contract IERC20 token, address from, address to, uint256 value) internal
```

### safeApprove

```solidity
function safeApprove(contract IERC20 token, address spender, uint256 value) internal
```

_Deprecated. This function has issues similar to the ones found in
{ERC20-approve}, and its usage is discouraged._

### safeIncreaseAllowance

```solidity
function safeIncreaseAllowance(contract IERC20 token, address spender, uint256 value) internal
```

### safeDecreaseAllowance

```solidity
function safeDecreaseAllowance(contract IERC20 token, address spender, uint256 value) internal
```

### _callOptionalReturn

```solidity
function _callOptionalReturn(contract IERC20 token, bytes data) private
```

## SafeMath

### add

```solidity
function add(uint256 a, uint256 b) internal pure returns (uint256)
```

### sub

```solidity
function sub(uint256 a, uint256 b) internal pure returns (uint256)
```

### sub

```solidity
function sub(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

### mul

```solidity
function mul(uint256 a, uint256 b) internal pure returns (uint256)
```

### div

```solidity
function div(uint256 a, uint256 b) internal pure returns (uint256)
```

### div

```solidity
function div(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

### mod

```solidity
function mod(uint256 a, uint256 b) internal pure returns (uint256)
```

### mod

```solidity
function mod(uint256 a, uint256 b, string errorMessage) internal pure returns (uint256)
```

## uSwap

### feeBeneficiaryAddress

```solidity
address feeBeneficiaryAddress
```

### feeBase

```solidity
uint256 feeBase
```

### feeTiers

```solidity
mapping(uint256 => bool) feeTiers
```

### authorizedAddresses

```solidity
mapping(address => bool) authorizedAddresses
```

### pools

```solidity
mapping(bytes32 => uint24) pools
```

### registry

```solidity
contract ServiceRegistry registry
```

### ReceivedLess

```solidity
error ReceivedLess(uint256 receiveAtLeast, uint256 received)
```

### Unauthorized

```solidity
error Unauthorized()
```

### FeeTierDoesNotExist

```solidity
error FeeTierDoesNotExist(uint256 fee)
```

### FeeTierAlreadyExists

```solidity
error FeeTierAlreadyExists(uint256 fee)
```

### SwapFailed

```solidity
error SwapFailed()
```

### constructor

```solidity
constructor(address authorisedCaller, address feeBeneficiary, uint256 _initialFee, address _registry) public
```

### AssetSwap

```solidity
event AssetSwap(address assetIn, address assetOut, uint256 amountIn, uint256 amountOut)
```

### FeePaid

```solidity
event FeePaid(address beneficiary, uint256 amount, address token)
```

### SlippageSaved

```solidity
event SlippageSaved(uint256 minimumPossible, uint256 actualAmount)
```

### FeeTierAdded

```solidity
event FeeTierAdded(uint256 fee)
```

### FeeTierRemoved

```solidity
event FeeTierRemoved(uint256 fee)
```

### SwapDescription

```solidity
struct SwapDescription {
  contract IERC20 srcToken;
  contract IERC20 dstToken;
  address payable srcReceiver;
  address payable dstReceiver;
  uint256 amount;
  uint256 minReturnAmount;
  uint256 flags;
  bytes permit;
}
```

### onlyAuthorised

```solidity
modifier onlyAuthorised()
```

### addFeeTier

```solidity
function addFeeTier(uint256 fee) public
```

### removeFeeTier

```solidity
function removeFeeTier(uint256 fee) public
```

### setPool

```solidity
function setPool(address fromToken, address toToken, uint24 pool) public
```

### getPool

```solidity
function getPool(address fromToken, address toToken) public view returns (uint24)
```

### verifyFee

```solidity
function verifyFee(uint256 feeId) public view returns (bool valid)
```

### _swap

```solidity
function _swap(address fromAsset, address toAsset, uint256 amount, uint256 receiveAtLeast) internal returns (uint256 balance)
```

### _collectFee

```solidity
function _collectFee(address asset, uint256 fromAmount, uint256 fee) internal returns (uint256 amount)
```

### compareMethodSigs

```solidity
function compareMethodSigs(bytes a, bytes b) internal pure returns (bool)
```

### decodeOneInchCallData

```solidity
function decodeOneInchCallData(bytes withData) public pure returns (uint256 minReturn)
```

### swapTokens

```solidity
function swapTokens(struct SwapData swapData) public returns (uint256)
```

## ServiceRegistry

### trustedAddresses

```solidity
mapping(address => bool) trustedAddresses
```

### lastExecuted

```solidity
mapping(bytes32 => uint256) lastExecuted
```

### namedService

```solidity
mapping(bytes32 => address) namedService
```

### owner

```solidity
address owner
```

### requiredDelay

```solidity
uint256 requiredDelay
```

### validateInput

```solidity
modifier validateInput(uint256 len)
```

### delayedExecution

```solidity
modifier delayedExecution()
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### constructor

```solidity
constructor(uint256 initialDelay) public
```

### transferOwnership

```solidity
function transferOwnership(address newOwner) public
```

### changeRequiredDelay

```solidity
function changeRequiredDelay(uint256 newDelay) public
```

### addTrustedAddress

```solidity
function addTrustedAddress(address trustedAddress) public
```

### removeTrustedAddress

```solidity
function removeTrustedAddress(address trustedAddress) public
```

### getServiceNameHash

```solidity
function getServiceNameHash(string name) public pure returns (bytes32)
```

### addNamedService

```solidity
function addNamedService(bytes32 serviceNameHash, address serviceAddress) public
```

### updateNamedService

```solidity
function updateNamedService(bytes32 serviceNameHash, address serviceAddress) public
```

### removeNamedService

```solidity
function removeNamedService(bytes32 serviceNameHash) public
```

### getRegisteredService

```solidity
function getRegisteredService(string serviceName) public view returns (address)
```

### getServiceAddress

```solidity
function getServiceAddress(bytes32 serviceNameHash) public view returns (address serviceAddress)
```

### clearScheduledExecution

```solidity
function clearScheduledExecution(bytes32 scheduledExecution) public
```

### ChangeScheduled

```solidity
event ChangeScheduled(bytes data, bytes32 dataHash, uint256 firstPossibleExecutionTime)
```

### ChangeCancelled

```solidity
event ChangeCancelled(bytes32 data)
```

### ChangeApplied

```solidity
event ChangeApplied(bytes data, uint256 firstPossibleExecutionTime)
```

### RemoveApplied

```solidity
event RemoveApplied(bytes32 nameHash)
```

## ISwapRouter

### ExactInputSingleParams

```solidity
struct ExactInputSingleParams {
  address tokenIn;
  address tokenOut;
  uint24 fee;
  address recipient;
  uint256 deadline;
  uint256 amountIn;
  uint256 amountOutMinimum;
  uint160 sqrtPriceLimitX96;
}
```

### exactInputSingle

```solidity
function exactInputSingle(struct ISwapRouter.ExactInputSingleParams params) external returns (uint256)
```

## UseStore

### registry

```solidity
contract ServiceRegistry registry
```

### constructor

```solidity
constructor(address _registry) internal
```

### store

```solidity
function store() internal view returns (contract OperationStorage)
```

## Read

### read

```solidity
function read(contract OperationStorage _storage, bytes32 param, uint256 paramMapping, address who) internal view returns (bytes32)
```

### readUint

```solidity
function readUint(contract OperationStorage _storage, bytes32 param, uint256 paramMapping, address who) internal view returns (uint256)
```

## Write

### write

```solidity
function write(contract OperationStorage _storage, bytes32 value) internal
```

## MakerOpenVault

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### _openVault

```solidity
function _openVault(struct OpenVaultData data) internal returns (bytes32)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct OpenVaultData params)
```

## OperationStorage

### action

```solidity
uint8 action
```

### actions

```solidity
bytes32[] actions
```

### returnValues

```solidity
mapping(address => bytes32[]) returnValues
```

### valuesHolders

```solidity
address[] valuesHolders
```

### locked

```solidity
bool locked
```

### whoLocked

```solidity
address whoLocked
```

### initiator

```solidity
address initiator
```

### operationExecutorAddress

```solidity
address operationExecutorAddress
```

### registry

```solidity
contract ServiceRegistry registry
```

### constructor

```solidity
constructor(contract ServiceRegistry _registry, address _operationExecutorAddress) public
```

### lock

```solidity
function lock() external
```

### unlock

```solidity
function unlock() external
```

### setInitiator

```solidity
function setInitiator(address _initiator) external
```

### setOperationActions

```solidity
function setOperationActions(bytes32[] _actions) external
```

### verifyAction

```solidity
function verifyAction(bytes32 actionHash) external
```

### hasActionsToVerify

```solidity
function hasActionsToVerify() external view returns (bool)
```

### push

```solidity
function push(bytes32 value) external
```

### at

```solidity
function at(uint256 index, address who) external view returns (bytes32)
```

### len

```solidity
function len(address who) external view returns (uint256)
```

### clearStorage

```solidity
function clearStorage() external
```

## FLASH_MINT_MODULE

```solidity
string FLASH_MINT_MODULE
```

## OPEN_VAULT_ACTION

```solidity
string OPEN_VAULT_ACTION
```

## DEPOSIT_ACTION

```solidity
string DEPOSIT_ACTION
```

## GENERATE_ACTION

```solidity
string GENERATE_ACTION
```

## PAYBACK_ACTION

```solidity
string PAYBACK_ACTION
```

## WITHDRAW_ACTION

```solidity
string WITHDRAW_ACTION
```

## MCD_MANAGER

```solidity
string MCD_MANAGER
```

## MCD_JUG

```solidity
string MCD_JUG
```

## MCD_JOIN_DAI

```solidity
string MCD_JOIN_DAI
```

## CDP_ALLOW

```solidity
string CDP_ALLOW
```

## DepositData

```solidity
struct DepositData {
  contract IJoin joinAddress;
  uint256 vaultId;
  uint256 amount;
}
```

## WithdrawData

```solidity
struct WithdrawData {
  uint256 vaultId;
  address userAddress;
  contract IJoin joinAddr;
  uint256 amount;
}
```

## GenerateData

```solidity
struct GenerateData {
  address to;
  uint256 vaultId;
  uint256 amount;
}
```

## PaybackData

```solidity
struct PaybackData {
  uint256 vaultId;
  address userAddress;
  uint256 amount;
  bool paybackAll;
}
```

## OpenVaultData

```solidity
struct OpenVaultData {
  contract IJoin joinAddress;
}
```

## CdpAllowData

```solidity
struct CdpAllowData {
  uint256 vaultId;
  address userAddress;
}
```

## IJoin

### ilk

```solidity
bytes32 ilk
```

### dec

```solidity
function dec() public view virtual returns (uint256)
```

### gem

```solidity
function gem() public view virtual returns (address)
```

### join

```solidity
function join(address, uint256) public payable virtual
```

### exit

```solidity
function exit(address, uint256) public virtual
```

## IManager

### last

```solidity
function last(address) public virtual returns (uint256)
```

### cdpCan

```solidity
function cdpCan(address, uint256, address) public view virtual returns (uint256)
```

### ilks

```solidity
function ilks(uint256) public view virtual returns (bytes32)
```

### owns

```solidity
function owns(uint256) public view virtual returns (address)
```

### urns

```solidity
function urns(uint256) public view virtual returns (address)
```

### vat

```solidity
function vat() public view virtual returns (contract IVat)
```

### open

```solidity
function open(bytes32, address) public virtual returns (uint256)
```

### give

```solidity
function give(uint256, address) public virtual
```

### cdpAllow

```solidity
function cdpAllow(uint256, address, uint256) public virtual
```

### urnAllow

```solidity
function urnAllow(address, uint256) public virtual
```

### frob

```solidity
function frob(uint256, int256, int256) public virtual
```

### flux

```solidity
function flux(uint256, address, uint256) public virtual
```

### move

```solidity
function move(uint256, address, uint256) public virtual
```

### exit

```solidity
function exit(address, uint256, address, uint256) public virtual
```

### quit

```solidity
function quit(uint256, address) public virtual
```

### enter

```solidity
function enter(address, uint256) public virtual
```

### shift

```solidity
function shift(uint256, uint256) public virtual
```

## IVat

### Urn

```solidity
struct Urn {
  uint256 ink;
  uint256 art;
}
```

### Ilk

```solidity
struct Ilk {
  uint256 Art;
  uint256 rate;
  uint256 spot;
  uint256 line;
  uint256 dust;
}
```

### urns

```solidity
mapping(bytes32 => mapping(address => struct IVat.Urn)) urns
```

### ilks

```solidity
mapping(bytes32 => struct IVat.Ilk) ilks
```

### gem

```solidity
mapping(bytes32 => mapping(address => uint256)) gem
```

### can

```solidity
function can(address, address) public view virtual returns (uint256)
```

### dai

```solidity
function dai(address) public view virtual returns (uint256)
```

### frob

```solidity
function frob(bytes32, address, address, address, int256, int256) public virtual
```

### hope

```solidity
function hope(address) public virtual
```

### move

```solidity
function move(address, address, uint256) public virtual
```

### fork

```solidity
function fork(bytes32, address, address, int256, int256) public virtual
```

## AaveBorrow

### dWETH

```solidity
contract IVariableDebtToken dWETH
```

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct BorrowData params)
```

## AaveDeposit

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct DepositData params)
```

## AavePayback

### dWETH

```solidity
contract IVariableDebtToken dWETH
```

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

## AaveWithdraw

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct WithdrawData params)
```

## ReturnFunds

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

## SendToken

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct SendTokenData params)
```

## SetApproval

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct SetApprovalData params)
```

## Swap

### feeBeneficiaryAddress

```solidity
address feeBeneficiaryAddress
```

### feeBase

```solidity
uint256 feeBase
```

### feeTiers

```solidity
mapping(uint256 => bool) feeTiers
```

### authorizedAddresses

```solidity
mapping(address => bool) authorizedAddresses
```

### registry

```solidity
contract ServiceRegistry registry
```

### ReceivedLess

```solidity
error ReceivedLess(uint256 receiveAtLeast, uint256 received)
```

### Unauthorized

```solidity
error Unauthorized()
```

### FeeTierDoesNotExist

```solidity
error FeeTierDoesNotExist(uint256 fee)
```

### FeeTierAlreadyExists

```solidity
error FeeTierAlreadyExists(uint256 fee)
```

### SwapFailed

```solidity
error SwapFailed()
```

### constructor

```solidity
constructor(address authorisedCaller, address feeBeneficiary, uint256 _initialFee, address _registry) public
```

### AssetSwap

```solidity
event AssetSwap(address assetIn, address assetOut, uint256 amountIn, uint256 amountOut)
```

### FeePaid

```solidity
event FeePaid(address beneficiary, uint256 amount, address token)
```

### SlippageSaved

```solidity
event SlippageSaved(uint256 minimumPossible, uint256 actualAmount)
```

### FeeTierAdded

```solidity
event FeeTierAdded(uint256 fee)
```

### FeeTierRemoved

```solidity
event FeeTierRemoved(uint256 fee)
```

### onlyAuthorised

```solidity
modifier onlyAuthorised()
```

### addFeeTier

```solidity
function addFeeTier(uint256 fee) public
```

### removeFeeTier

```solidity
function removeFeeTier(uint256 fee) public
```

### verifyFee

```solidity
function verifyFee(uint256 feeId) public view returns (bool valid)
```

### _swap

```solidity
function _swap(address fromAsset, address toAsset, uint256 amount, uint256 receiveAtLeast, address callee, bytes withData) internal returns (uint256 balance)
```

### _collectFee

```solidity
function _collectFee(address asset, uint256 fromAmount, uint256 fee) internal returns (uint256 amount)
```

### swapTokens

```solidity
function swapTokens(struct SwapData swapData) public returns (uint256)
```

## SwapAction

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct SwapData params)
```

## TakeFlashloan

### registry

```solidity
contract ServiceRegistry registry
```

### dai

```solidity
address dai
```

### constructor

```solidity
constructor(contract ServiceRegistry _registry, address _dai) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct FlashloanData params)
```

## UnwrapEth

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct UnwrapEthData params)
```

## WrapEth

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct WrapEthData params)
```

## CdpAllow

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct CdpAllowData params)
```

## MakerDeposit

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _deposit

```solidity
function _deposit(struct DepositData data) internal returns (bytes32)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct DepositData params)
```

## MakerGenerate

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _generate

```solidity
function _generate(struct GenerateData data) internal returns (bytes32)
```

### _getDrawDart

```solidity
function _getDrawDart(contract IVat vat, address jug, address urn, bytes32 ilk, uint256 wad) internal returns (int256 dart)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct GenerateData params)
```

## MakerPayback

### WipeData

```solidity
struct WipeData {
  contract IVat vat;
  address usr;
  address urn;
  uint256 dai;
  bytes32 ilk;
}
```

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _payback

```solidity
function _payback(contract IManager manager, contract IDaiJoin daiJoin, struct PaybackData data) internal returns (bytes32)
```

### _paybackAll

```solidity
function _paybackAll(contract IManager manager, contract IDaiJoin daiJoin, struct PaybackData data) internal returns (bytes32)
```

### joinDai

```solidity
function joinDai(address usr, contract IDaiJoin daiJoin, address urn, uint256 amount) public
```

### _getWipeDart

```solidity
function _getWipeDart(struct MakerPayback.WipeData data) internal view returns (int256 dart)
```

### _getWipeAllWad

```solidity
function _getWipeAllWad(struct MakerPayback.WipeData data) internal view returns (uint256 wad)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct PaybackData params)
```

## MakerWithdraw

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _withdraw

```solidity
function _withdraw(struct WithdrawData data) internal returns (bytes32)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct WithdrawData params)
```

## OperationExecutor

### registry

```solidity
contract ServiceRegistry registry
```

### Operation

```solidity
event Operation(string name, struct Call[] calls)
```

_Emitted once an Operation has completed execution_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The address initiating the deposit |
| calls | struct Call[] | The call data for the actions the operation must executes |

### constructor

```solidity
constructor(contract ServiceRegistry _registry) public
```

### executeOp

```solidity
function executeOp(struct Call[] calls, string operationName) public payable
```

### aggregate

```solidity
function aggregate(struct Call[] calls) internal
```

### callbackAggregate

```solidity
function callbackAggregate(struct Call[] calls) external
```

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address asset, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

## StoredOperation

```solidity
struct StoredOperation {
  bytes32[] actions;
  string name;
}
```

## OperationsRegistry

### operations

```solidity
mapping(string => struct StoredOperation) operations
```

### owner

```solidity
address owner
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### constructor

```solidity
constructor() public
```

### transferOwnership

```solidity
function transferOwnership(address newOwner) public
```

### OperationAdded

```solidity
event OperationAdded(string name)
```

_Emitted when a new operation is added or an existing operation is updated_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The Operation name |

### addOperation

```solidity
function addOperation(string name, bytes32[] actions) external
```

### getOperation

```solidity
function getOperation(string name) external view returns (bytes32[] actions)
```

## AAVE_LENDING_POOL

```solidity
string AAVE_LENDING_POOL
```

## AAVE_WETH_GATEWAY

```solidity
string AAVE_WETH_GATEWAY
```

## BORROW_ACTION

```solidity
string BORROW_ACTION
```

## DEPOSIT_ACTION

```solidity
string DEPOSIT_ACTION
```

## WITHDRAW_ACTION

```solidity
string WITHDRAW_ACTION
```

## PAYBACK_ACTION

```solidity
string PAYBACK_ACTION
```

## DepositData

```solidity
struct DepositData {
  address asset;
  uint256 amount;
}
```

## BorrowData

```solidity
struct BorrowData {
  address asset;
  uint256 amount;
  address to;
}
```

## WithdrawData

```solidity
struct WithdrawData {
  address asset;
  uint256 amount;
  address to;
}
```

## PaybackData

```solidity
struct PaybackData {
  address asset;
  uint256 amount;
  bool paybackAll;
}
```

## McdView

### MANAGER_ADDRESS

```solidity
address MANAGER_ADDRESS
```

### VAT_ADDRESS

```solidity
address VAT_ADDRESS
```

### SPOTTER_ADDRESS

```solidity
address SPOTTER_ADDRESS
```

### manager

```solidity
contract IManager manager
```

### vat

```solidity
contract IVat vat
```

### spotter

```solidity
contract ISpotter spotter
```

### getVaultInfo

```solidity
function getVaultInfo(uint256 _vaultId, bytes32 _ilk) public view returns (uint256, uint256)
```

Gets Position info (collateral, debt)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _vaultId | uint256 | Id of the Position |
| _ilk | bytes32 | Ilk of the Position |

### getPrice

```solidity
function getPrice(bytes32 _ilk) public view returns (uint256)
```

Gets a price of the asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ilk | bytes32 | Ilk of the Position |

### getRatio

```solidity
function getRatio(uint256 _vaultId) public view returns (uint256)
```

Gets Vaults ratio

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _vaultId | uint256 | Id of the Position |

## IExchange

### swapDaiForToken

```solidity
function swapDaiForToken(address asset, uint256 amount, uint256 receiveAtLeast, address callee, bytes withData) external virtual
```

### swapTokenForDai

```solidity
function swapTokenForDai(address asset, uint256 amount, uint256 receiveAtLeast, address callee, bytes withData) external virtual
```

### swapTokenForToken

```solidity
function swapTokenForToken(address assetFrom, address assetTo, uint256 amount, uint256 receiveAtLeast) external virtual
```

## DataTypes

### ReserveData

```solidity
struct ReserveData {
  struct DataTypes.ReserveConfigurationMap configuration;
  uint128 liquidityIndex;
  uint128 variableBorrowIndex;
  uint128 currentLiquidityRate;
  uint128 currentVariableBorrowRate;
  uint128 currentStableBorrowRate;
  uint40 lastUpdateTimestamp;
  address aTokenAddress;
  address stableDebtTokenAddress;
  address variableDebtTokenAddress;
  address interestRateStrategyAddress;
  uint8 id;
}
```

### ReserveConfigurationMap

```solidity
struct ReserveConfigurationMap {
  uint256 data;
}
```

### UserConfigurationMap

```solidity
struct UserConfigurationMap {
  uint256 data;
}
```

### InterestRateMode

```solidity
enum InterestRateMode {
  NONE,
  STABLE,
  VARIABLE
}
```

## ILendingPool

### Deposit

```solidity
event Deposit(address reserve, address user, address onBehalfOf, uint256 amount, uint16 referral)
```

_Emitted on deposit()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| user | address | The address initiating the deposit |
| onBehalfOf | address | The beneficiary of the deposit, receiving the aTokens |
| amount | uint256 | The amount deposited |
| referral | uint16 | The referral code used |

### Withdraw

```solidity
event Withdraw(address reserve, address user, address to, uint256 amount)
```

_Emitted on withdraw()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlyng asset being withdrawn |
| user | address | The address initiating the withdrawal, owner of aTokens |
| to | address | Address that will receive the underlying |
| amount | uint256 | The amount to be withdrawn |

### Borrow

```solidity
event Borrow(address reserve, address user, address onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 referral)
```

_Emitted on borrow() and flashLoan() when debt needs to be opened_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset being borrowed |
| user | address | The address of the user initiating the borrow(), receiving the funds on borrow() or just initiator of the transaction on flashLoan() |
| onBehalfOf | address | The address that will be getting the debt |
| amount | uint256 | The amount borrowed out |
| borrowRateMode | uint256 | The rate mode: 1 for Stable, 2 for Variable |
| borrowRate | uint256 | The numeric rate at which the user has borrowed |
| referral | uint16 | The referral code used |

### Repay

```solidity
event Repay(address reserve, address user, address repayer, uint256 amount)
```

_Emitted on repay()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| user | address | The beneficiary of the repayment, getting his debt reduced |
| repayer | address | The address of the user initiating the repay(), providing the funds |
| amount | uint256 | The amount repaid |

### Swap

```solidity
event Swap(address reserve, address user, uint256 rateMode)
```

_Emitted on swapBorrowRateMode()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| user | address | The address of the user swapping his rate mode |
| rateMode | uint256 | The rate mode that the user wants to swap to |

### ReserveUsedAsCollateralEnabled

```solidity
event ReserveUsedAsCollateralEnabled(address reserve, address user)
```

_Emitted on setUserUseReserveAsCollateral()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| user | address | The address of the user enabling the usage as collateral |

### ReserveUsedAsCollateralDisabled

```solidity
event ReserveUsedAsCollateralDisabled(address reserve, address user)
```

_Emitted on setUserUseReserveAsCollateral()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| user | address | The address of the user enabling the usage as collateral |

### RebalanceStableBorrowRate

```solidity
event RebalanceStableBorrowRate(address reserve, address user)
```

_Emitted on rebalanceStableBorrowRate()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| user | address | The address of the user for which the rebalance has been executed |

### FlashLoan

```solidity
event FlashLoan(address target, address initiator, address asset, uint256 amount, uint256 premium, uint16 referralCode)
```

_Emitted on flashLoan()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| target | address | The address of the flash loan receiver contract |
| initiator | address | The address initiating the flash loan |
| asset | address | The address of the asset being flash borrowed |
| amount | uint256 | The amount flash borrowed |
| premium | uint256 | The fee flash borrowed |
| referralCode | uint16 | The referral code used |

### Paused

```solidity
event Paused()
```

_Emitted when the pause is triggered._

### Unpaused

```solidity
event Unpaused()
```

_Emitted when the pause is lifted._

### LiquidationCall

```solidity
event LiquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)
```

_Emitted when a borrower is liquidated. This event is emitted by the LendingPool via
LendingPoolCollateral manager using a DELEGATECALL
This allows to have the events in the generated ABI for LendingPool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| collateralAsset | address | The address of the underlying asset used as collateral, to receive as result of the liquidation |
| debtAsset | address | The address of the underlying borrowed asset to be repaid with the liquidation |
| user | address | The address of the borrower getting liquidated |
| debtToCover | uint256 | The debt amount of borrowed `asset` the liquidator wants to cover |
| liquidatedCollateralAmount | uint256 | The amount of collateral received by the liiquidator |
| liquidator | address | The address of the liquidator |
| receiveAToken | bool | `true` if the liquidators wants to receive the collateral aTokens, `false` if he wants to receive the underlying collateral asset directly |

### ReserveDataUpdated

```solidity
event ReserveDataUpdated(address reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)
```

_Emitted when the state of a reserve is updated. NOTE: This event is actually declared
in the ReserveLogic library and emitted in the updateInterestRates() function. Since the function is internal,
the event will actually be fired by the LendingPool contract. The event is therefore replicated here so it
gets added to the LendingPool ABI_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reserve | address | The address of the underlying asset of the reserve |
| liquidityRate | uint256 | The new liquidity rate |
| stableBorrowRate | uint256 | The new stable borrow rate |
| variableBorrowRate | uint256 | The new variable borrow rate |
| liquidityIndex | uint256 | The new liquidity index |
| variableBorrowIndex | uint256 | The new variable borrow index |

### deposit

```solidity
function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external
```

_Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
- E.g. User deposits 100 USDC and gets in return 100 aUSDC_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset to deposit |
| amount | uint256 | The amount to be deposited |
| onBehalfOf | address | The address that will receive the aTokens, same as msg.sender if the user   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens   is a different wallet |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### withdraw

```solidity
function withdraw(address asset, uint256 amount, address to) external returns (uint256)
```

_Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset to withdraw |
| amount | uint256 | The underlying amount to be withdrawn   - Send the value type(uint256).max in order to withdraw the whole aToken balance |
| to | address | Address that will receive the underlying, same as msg.sender if the user   wants to receive it on his own wallet, or a different address if the beneficiary is a   different wallet |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount withdrawn |

### borrow

```solidity
function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external
```

_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral, or he was given enough allowance by a credit delegator on the
corresponding debt token (StableDebtToken or VariableDebtToken)
- E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet
  and 100 stable/variable debt tokens, depending on the `interestRateMode`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset to borrow |
| amount | uint256 | The amount to be borrowed |
| interestRateMode | uint256 | The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |
| onBehalfOf | address | Address of the user who will receive the debt. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |

### repay

```solidity
function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256)
```

Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned
- E.g. User repays 100 USDC, burning 100 variable/stable debt tokens of the `onBehalfOf` address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the borrowed underlying asset previously borrowed |
| amount | uint256 | The amount to repay - Send the value type(uint256).max in order to repay the whole debt for `asset` on the specific `debtMode` |
| rateMode | uint256 | The interest rate mode at of the debt the user wants to repay: 1 for Stable, 2 for Variable |
| onBehalfOf | address | Address of the user who will get his debt reduced/removed. Should be the address of the user calling the function if he wants to reduce/remove his own debt, or the address of any other other borrower whose debt should be removed |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The final amount repaid |

### swapBorrowRateMode

```solidity
function swapBorrowRateMode(address asset, uint256 rateMode) external
```

_Allows a borrower to swap his debt between stable and variable mode, or viceversa_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset borrowed |
| rateMode | uint256 | The rate mode that the user wants to swap to |

### rebalanceStableBorrowRate

```solidity
function rebalanceStableBorrowRate(address asset, address user) external
```

_Rebalances the stable interest rate of a user to the current stable rate defined on the reserve.
- Users can be rebalanced if the following conditions are satisfied:
    1. Usage ratio is above 95%
    2. the current deposit APY is below REBALANCE_UP_THRESHOLD * maxVariableBorrowRate, which means that too much has been
       borrowed at a stable rate and depositors are not earning enough_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset borrowed |
| user | address | The address of the user to be rebalanced |

### setUserUseReserveAsCollateral

```solidity
function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external
```

_Allows depositors to enable/disable a specific deposited asset as collateral_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset deposited |
| useAsCollateral | bool | `true` if the user wants to use the deposit as collateral, `false` otherwise |

### liquidationCall

```solidity
function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken) external
```

_Function to liquidate a non-healthy position collateral-wise, with Health Factor below 1
- The caller (liquidator) covers `debtToCover` amount of debt of the user getting liquidated, and receives
  a proportionally amount of the `collateralAsset` plus a bonus to cover market risk_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| collateralAsset | address | The address of the underlying asset used as collateral, to receive as result of the liquidation |
| debtAsset | address | The address of the underlying borrowed asset to be repaid with the liquidation |
| user | address | The address of the borrower getting liquidated |
| debtToCover | uint256 | The debt amount of borrowed `asset` the liquidator wants to cover |
| receiveAToken | bool | `true` if the liquidators wants to receive the collateral aTokens, `false` if he wants to receive the underlying collateral asset directly |

### flashLoan

```solidity
function flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode) external
```

_Allows smartcontracts to access the liquidity of the pool within one transaction,
as long as the amount taken plus a fee is returned.
IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept into consideration.
For further details please visit https://developers.aave.com_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiverAddress | address | The address of the contract receiving the funds, implementing the IFlashLoanReceiver interface |
| assets | address[] | The addresses of the assets being flash-borrowed |
| amounts | uint256[] | The amounts amounts being flash-borrowed |
| modes | uint256[] | Types of the debt to open if the flash loan is not returned:   0 -> Don't open any debt, just revert if funds can't be transferred from the receiver   1 -> Open debt at stable rate for the value of the amount flash-borrowed to the `onBehalfOf` address   2 -> Open debt at variable rate for the value of the amount flash-borrowed to the `onBehalfOf` address |
| onBehalfOf | address | The address  that will receive the debt in the case of using on `modes` 1 or 2 |
| params | bytes | Variadic packed params to pass to the receiver as extra information |
| referralCode | uint16 | Code used to register the integrator originating the operation, for potential rewards.   0 if the action is executed directly by the user, without any middle-man |

### getUserAccountData

```solidity
function getUserAccountData(address user) external view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)
```

_Returns the user account data across all the reserves_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalCollateralETH | uint256 | the total collateral in ETH of the user |
| totalDebtETH | uint256 | the total debt in ETH of the user |
| availableBorrowsETH | uint256 | the borrowing power left of the user |
| currentLiquidationThreshold | uint256 | the liquidation threshold of the user |
| ltv | uint256 | the loan to value of the user |
| healthFactor | uint256 | the current health factor of the user |

### initReserve

```solidity
function initReserve(address reserve, address aTokenAddress, address stableDebtAddress, address variableDebtAddress, address interestRateStrategyAddress) external
```

### setReserveInterestRateStrategyAddress

```solidity
function setReserveInterestRateStrategyAddress(address reserve, address rateStrategyAddress) external
```

### setConfiguration

```solidity
function setConfiguration(address reserve, uint256 configuration) external
```

### getConfiguration

```solidity
function getConfiguration(address asset) external view returns (struct DataTypes.ReserveConfigurationMap)
```

_Returns the configuration of the reserve_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.ReserveConfigurationMap | The configuration of the reserve |

### getUserConfiguration

```solidity
function getUserConfiguration(address user) external view returns (struct DataTypes.UserConfigurationMap)
```

_Returns the configuration of the user across all the reserves_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.UserConfigurationMap | The configuration of the user |

### getReserveNormalizedIncome

```solidity
function getReserveNormalizedIncome(address asset) external view returns (uint256)
```

_Returns the normalized income normalized income of the reserve_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve's normalized income |

### getReserveNormalizedVariableDebt

```solidity
function getReserveNormalizedVariableDebt(address asset) external view returns (uint256)
```

_Returns the normalized variable debt per unit of asset_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The reserve normalized variable debt |

### getReserveData

```solidity
function getReserveData(address asset) external view returns (struct DataTypes.ReserveData)
```

_Returns the state and configuration of the reserve_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct DataTypes.ReserveData | The state of the reserve |

### finalizeTransfer

```solidity
function finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromAfter, uint256 balanceToBefore) external
```

### getReservesList

```solidity
function getReservesList() external view returns (address[])
```

### getAddressesProvider

```solidity
function getAddressesProvider() external view returns (contract ILendingPoolAddressesProvider)
```

### setPause

```solidity
function setPause(bool val) external
```

### paused

```solidity
function paused() external view returns (bool)
```

## ILendingPoolAddressesProvider

_Main registry of addresses part of or connected to the protocol, including permissioned roles
- Acting also as factory of proxies and admin of those, so with right to change its implementations
- Owned by the Aave Governance_

### MarketIdSet

```solidity
event MarketIdSet(string newMarketId)
```

### LendingPoolUpdated

```solidity
event LendingPoolUpdated(address newAddress)
```

### ConfigurationAdminUpdated

```solidity
event ConfigurationAdminUpdated(address newAddress)
```

### EmergencyAdminUpdated

```solidity
event EmergencyAdminUpdated(address newAddress)
```

### LendingPoolConfiguratorUpdated

```solidity
event LendingPoolConfiguratorUpdated(address newAddress)
```

### LendingPoolCollateralManagerUpdated

```solidity
event LendingPoolCollateralManagerUpdated(address newAddress)
```

### PriceOracleUpdated

```solidity
event PriceOracleUpdated(address newAddress)
```

### LendingRateOracleUpdated

```solidity
event LendingRateOracleUpdated(address newAddress)
```

### ProxyCreated

```solidity
event ProxyCreated(bytes32 id, address newAddress)
```

### AddressSet

```solidity
event AddressSet(bytes32 id, address newAddress, bool hasProxy)
```

### getMarketId

```solidity
function getMarketId() external view returns (string)
```

### setMarketId

```solidity
function setMarketId(string marketId) external
```

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external
```

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address impl) external
```

### getAddress

```solidity
function getAddress(bytes32 id) external view returns (address)
```

### getLendingPool

```solidity
function getLendingPool() external view returns (address)
```

### setLendingPoolImpl

```solidity
function setLendingPoolImpl(address pool) external
```

### getLendingPoolConfigurator

```solidity
function getLendingPoolConfigurator() external view returns (address)
```

### setLendingPoolConfiguratorImpl

```solidity
function setLendingPoolConfiguratorImpl(address configurator) external
```

### getLendingPoolCollateralManager

```solidity
function getLendingPoolCollateralManager() external view returns (address)
```

### setLendingPoolCollateralManager

```solidity
function setLendingPoolCollateralManager(address manager) external
```

### getPoolAdmin

```solidity
function getPoolAdmin() external view returns (address)
```

### setPoolAdmin

```solidity
function setPoolAdmin(address admin) external
```

### getEmergencyAdmin

```solidity
function getEmergencyAdmin() external view returns (address)
```

### setEmergencyAdmin

```solidity
function setEmergencyAdmin(address admin) external
```

### getPriceOracle

```solidity
function getPriceOracle() external view returns (address)
```

### setPriceOracle

```solidity
function setPriceOracle(address priceOracle) external
```

### getLendingRateOracle

```solidity
function getLendingRateOracle() external view returns (address)
```

### setLendingRateOracle

```solidity
function setLendingRateOracle(address lendingRateOracle) external
```

## IScaledBalanceToken

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user whose balance is calculated |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |
| [1] | uint256 | The scaled balance and the scaled total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() external view returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled total supply |

## IVariableDebtToken

Defines the basic interface for a variable debt token.

### Mint

```solidity
event Mint(address from, address onBehalfOf, uint256 value, uint256 index)
```

_Emitted after the mint action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address performing the mint |
| onBehalfOf | address | The address of the user on which behalf minting has been performed |
| value | uint256 | The amount to be minted |
| index | uint256 | The last index of the reserve |

### approveDelegation

```solidity
function approveDelegation(address delegatee, uint256 amount) external
```

_delegates borrowing power to a user on the specific debt token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address receiving the delegated borrowing power |
| amount | uint256 | the maximum amount being delegated. Delegation will still respect the liquidation constraints (even if delegated, a delegatee cannot force a delegator HF to go below 1) |

### borrowAllowance

```solidity
function borrowAllowance(address fromUser, address toUser) external view returns (uint256)
```

_returns the borrow allowance of the user_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromUser | address | The user to giving allowance |
| toUser | address | The user to give allowance to |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the current allowance of toUser |

### mint

```solidity
function mint(address user, address onBehalfOf, uint256 amount, uint256 index) external returns (bool)
```

_Mints debt token to the `onBehalfOf` address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address receiving the borrowed underlying, being the delegatee in case of credit delegate, or same as `onBehalfOf` otherwise |
| onBehalfOf | address | The address receiving the debt tokens |
| amount | uint256 | The amount of debt being minted |
| index | uint256 | The variable debt index of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user is 0 |

### Burn

```solidity
event Burn(address user, uint256 amount, uint256 index)
```

_Emitted when variable debt is burnt_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user which debt has been burned |
| amount | uint256 | The amount of debt being burned |
| index | uint256 | The index of the user |

### burn

```solidity
function burn(address user, uint256 amount, uint256 index) external
```

_Burns user variable debt_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user which debt is burnt |
| amount | uint256 |  |
| index | uint256 | The variable debt index of the reserve |

## IWETHGateway

### borrowETH

```solidity
function borrowETH(address lendingPool, uint256 amount, uint256 interestRateMode, uint16 referralCode) external
```

## IERC3156FlashBorrower

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

_Receive a flash loan._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The initiator of the loan. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| fee | uint256 | The additional amount of tokens to repay. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The keccak256 hash of "ERC3156FlashBorrower.onFlashLoan" |

## IERC3156FlashLender

### maxFlashLoan

```solidity
function maxFlashLoan(address token) external view returns (uint256)
```

_The amount of currency available to be lent._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of `token` that can be borrowed. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) external view returns (uint256)
```

_The fee to be charged for a given loan._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of `token` to be charged for the loan, on top of the returned principal. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrower receiver, address token, uint256 amount, bytes data) external returns (bool)
```

_Initiate a flash loan._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrower | The receiver of the tokens in the loan, and the receiver of the callback. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

## IDaiJoin

### vat

```solidity
function vat() public virtual returns (contract IVat)
```

### dai

```solidity
function dai() public virtual returns (address)
```

### join

```solidity
function join(address, uint256) public payable virtual
```

### exit

```solidity
function exit(address, uint256) public virtual
```

## IJug

### Ilk

```solidity
struct Ilk {
  uint256 duty;
  uint256 rho;
}
```

### ilks

```solidity
mapping(bytes32 => struct IJug.Ilk) ilks
```

### drip

```solidity
function drip(bytes32) public virtual returns (uint256)
```

## IPipInterface

### read

```solidity
function read() public virtual returns (bytes32)
```

## ISpotter

### Ilk

```solidity
struct Ilk {
  contract IPipInterface pip;
  uint256 mat;
}
```

### ilks

```solidity
mapping(bytes32 => struct ISpotter.Ilk) ilks
```

### par

```solidity
uint256 par
```

## IWETH

### allowance

```solidity
function allowance(address, address) external returns (uint256)
```

### balanceOf

```solidity
function balanceOf(address) external returns (uint256)
```

### approve

```solidity
function approve(address, uint256) external
```

### transfer

```solidity
function transfer(address, uint256) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address, address, uint256) external returns (bool)
```

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256) external
```

## DSAuthEvents

### LogSetAuthority

```solidity
event LogSetAuthority(address authority)
```

### LogSetOwner

```solidity
event LogSetOwner(address owner)
```

## DSAuth

### authority

```solidity
contract DSAuthority authority
```

### owner

```solidity
address owner
```

### constructor

```solidity
constructor() public
```

### setOwner

```solidity
function setOwner(address owner_) public
```

### setAuthority

```solidity
function setAuthority(contract DSAuthority authority_) public
```

### auth

```solidity
modifier auth()
```

### isAuthorized

```solidity
function isAuthorized(address src, bytes4 sig) internal view returns (bool)
```

## DSAuthority

### canCall

```solidity
function canCall(address src, address dst, bytes4 sig) public view virtual returns (bool)
```

## DSGuard

### canCall

```solidity
function canCall(address src_, address dst_, bytes4 sig) public view virtual returns (bool)
```

### permit

```solidity
function permit(bytes32 src, bytes32 dst, bytes32 sig) public virtual
```

### forbid

```solidity
function forbid(bytes32 src, bytes32 dst, bytes32 sig) public virtual
```

### permit

```solidity
function permit(address src, address dst, bytes32 sig) public virtual
```

### forbid

```solidity
function forbid(address src, address dst, bytes32 sig) public virtual
```

## DSGuardFactory

### newGuard

```solidity
function newGuard() public virtual returns (contract DSGuard guard)
```

## DSMath

### add

```solidity
function add(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### sub

```solidity
function sub(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### mul

```solidity
function mul(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### div

```solidity
function div(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### min

```solidity
function min(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### max

```solidity
function max(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### imin

```solidity
function imin(int256 x, int256 y) internal pure returns (int256 z)
```

### imax

```solidity
function imax(int256 x, int256 y) internal pure returns (int256 z)
```

### WAD

```solidity
uint256 WAD
```

### RAY

```solidity
uint256 RAY
```

### wmul

```solidity
function wmul(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### rmul

```solidity
function rmul(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### wdiv

```solidity
function wdiv(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### rdiv

```solidity
function rdiv(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### rpow

```solidity
function rpow(uint256 x, uint256 n) internal pure returns (uint256 z)
```

## DSNote

### LogNote

```solidity
event LogNote(bytes4 sig, address guy, bytes32 foo, bytes32 bar, uint256 wad, bytes fax)
```

### note

```solidity
modifier note()
```

## DSProxy

### cache

```solidity
contract DSProxyCache cache
```

### constructor

```solidity
constructor(address _cacheAddr) internal
```

### receive

```solidity
receive() external payable
```

### execute

```solidity
function execute(bytes _code, bytes _data) public payable virtual returns (address target, bytes32 response)
```

### execute

```solidity
function execute(address _target, bytes _data) public payable virtual returns (bytes32 response)
```

### setCache

```solidity
function setCache(address _cacheAddr) public payable virtual returns (bool)
```

## DSProxyCache

### cache

```solidity
mapping(bytes32 => address) cache
```

### read

```solidity
function read(bytes _code) public view returns (address)
```

### write

```solidity
function write(bytes _code) public returns (address target)
```

## ProxyPermission

### FACTORY_ADDRESS

```solidity
address FACTORY_ADDRESS
```

### ALLOWED_METHOD_HASH

```solidity
bytes4 ALLOWED_METHOD_HASH
```

### givePermission

```solidity
function givePermission(address _contractAddr) public
```

### removePermission

```solidity
function removePermission(address _contractAddr) public
```

## MathUtils

### RAY

```solidity
uint256 RAY
```

### uintToInt

```solidity
function uintToInt(uint256 x) internal pure returns (int256 y)
```

### convertTo18

```solidity
function convertTo18(contract IJoin gemJoin, uint256 amt) internal view returns (uint256 wad)
```

## DummyAction

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

## DummyAutomation

### registry

```solidity
contract ServiceRegistry registry
```

### constructor

```solidity
constructor(contract ServiceRegistry _registry) public
```

### doAutomationStuffDelegateCall

```solidity
function doAutomationStuffDelegateCall(bytes executionData, address opExecutorAddress, uint256 vaultId, address commandAddress) public
```

## DummyCommand

### registry

```solidity
contract ServiceRegistry registry
```

### constructor

```solidity
constructor(contract ServiceRegistry _registry) public
```

### execute

```solidity
function execute(bytes executionData, address opExecutorAddress) public
```

## DummySwap

### WETH

```solidity
contract IWETH WETH
```

### exchange

```solidity
address exchange
```

### constructor

```solidity
constructor(contract ServiceRegistry _registry, contract IWETH _weth, address _exchange) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

## IAToken

### Mint

```solidity
event Mint(address from, uint256 value, uint256 index)
```

_Emitted after the mint action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address performing the mint |
| value | uint256 | The amount being |
| index | uint256 | The new liquidity index of the reserve |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

_Mints `amount` aTokens to `user`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user was 0 |

### Burn

```solidity
event Burn(address from, address target, uint256 value, uint256 index)
```

_Emitted after aTokens are burned_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The owner of the aTokens, getting them burned |
| target | address | The address that will receive the underlying |
| value | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### BalanceTransfer

```solidity
event BalanceTransfer(address from, address to, uint256 value, uint256 index)
```

_Emitted during the transfer action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The user whose tokens are being transferred |
| to | address | The recipient |
| value | uint256 | The amount being transferred |
| index | uint256 | The new liquidity index of the reserve |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

_Burns aTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The owner of the aTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying |
| amount | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

_Mints aTokens to the reserve treasury_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

### transferOnLiquidation

```solidity
function transferOnLiquidation(address from, address to, uint256 value) external
```

_Transfers aTokens in the event of a borrow being liquidated, in case the liquidators reclaims the aToken_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address getting liquidated, current owner of the aTokens |
| to | address | The recipient |
| value | uint256 | The amount of tokens getting transferred |

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address user, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendingPool to transfer
assets in borrow(), withdraw() and flashLoan()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The recipient of the aTokens |
| amount | uint256 | The amount getting transferred |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount transferred |

## ICat

### Ilk

```solidity
struct Ilk {
  address flip;
  uint256 chop;
  uint256 lump;
}
```

### ilks

```solidity
mapping(bytes32 => struct ICat.Ilk) ilks
```

## IGem

### approve

```solidity
function approve(address, uint256) public virtual
```

### transfer

```solidity
function transfer(address, uint256) public virtual returns (bool)
```

### transferFrom

```solidity
function transferFrom(address, address, uint256) public virtual returns (bool)
```

### deposit

```solidity
function deposit() public payable virtual
```

### withdraw

```solidity
function withdraw(uint256) public virtual
```

### allowance

```solidity
function allowance(address, address) public virtual returns (uint256)
```

## IGetCdps

### getCdpsAsc

```solidity
function getCdpsAsc(address manager, address guy) external view virtual returns (uint256[] ids, address[] urns, bytes32[] ilks)
```

### getCdpsDesc

```solidity
function getCdpsDesc(address manager, address guy) external view virtual returns (uint256[] ids, address[] urns, bytes32[] ilks)
```

## IOsm

### bud

```solidity
mapping(address => uint256) bud
```

### peep

```solidity
function peep() external view virtual returns (bytes32, bool)
```

## DummyExchange

### DAI_ADDRESS

```solidity
address DAI_ADDRESS
```

### STETH_ADDRESS

```solidity
address STETH_ADDRESS
```

### price

```solidity
uint256 price
```

### fee

```solidity
uint8 fee
```

### feeBase

```solidity
uint256 feeBase
```

### precisions

```solidity
mapping(address => uint8) precisions
```

### prices

```solidity
mapping(address => uint256) prices
```

### feeBeneficiaryAddress

```solidity
address feeBeneficiaryAddress
```

### AssetSwap

```solidity
event AssetSwap(address assetIn, address assetOut, uint256 amountIn, uint256 amountOut)
```

### FeePaid

```solidity
event FeePaid(address beneficiary, uint256 amount)
```

### SlippageSaved

```solidity
event SlippageSaved(uint256 minimumPossible, uint256 actualAmount)
```

### mul

```solidity
function mul(uint256 x, uint256 y) internal pure returns (uint256 z)
```

### setPrice

```solidity
function setPrice(address token, uint256 p) public
```

### setFee

```solidity
function setFee(uint8 f) public
```

### setPrecision

```solidity
function setPrecision(address token, uint8 _precision) public
```

### _transferIn

```solidity
function _transferIn(address from, address asset, uint256 amount) internal
```

### _transferOut

```solidity
function _transferOut(address asset, address to, uint256 amount) internal
```

### _collectFee

```solidity
function _collectFee(address asset, uint256 fromAmount) public returns (uint256)
```

### swapDaiForToken

```solidity
function swapDaiForToken(address asset, uint256 amount, uint256, address, bytes) public
```

### swapTokenForToken

```solidity
function swapTokenForToken(address assetFrom, address assetTo, uint256 amount, uint256) public
```

### swapTokenForDai

```solidity
function swapTokenForDai(address asset, uint256 amount, uint256, address, bytes) public
```

