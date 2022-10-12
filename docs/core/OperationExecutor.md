# Solidity API

## OperationExecutor

Is responsible for executing sequences of Actions (Operations)

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
| calls | struct Call[] | An array of Action calls the operation must execute |

### constructor

```solidity
constructor(contract ServiceRegistry _registry) public
```

### executeOp

```solidity
function executeOp(struct Call[] calls, string operationName) public payable
```

Executes an operation

_Operation storage is cleared before and after an operation is executed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calls | struct Call[] | An array of Action calls the operation must execute |
| operationName | string | The name of the Operation being executed |

### aggregate

```solidity
function aggregate(struct Call[] calls) internal
```

### callbackAggregate

```solidity
function callbackAggregate(struct Call[] calls) external
```

Not to be called directly

_Is called by the Operation Executor via a user's proxy to execute Actions nested in the FlashloanAction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calls | struct Call[] | An array of Action calls the operation must execute |

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address asset, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

Not to be called directly.

_Callback handler for use by a flashloan lender contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | Is the address of the contract that initiated the flashloan (EG Operation Executor) |
| asset | address | The address of the asset being flash loaned |
| amount | uint256 | The size of the flash loan |
| fee | uint256 | The Fee charged for the loan |
| data | bytes | Any calldata sent to the contract for execution later in the callback |

