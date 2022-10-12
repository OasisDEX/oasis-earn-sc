# Solidity API

## OperationStorage

Stores the return values from Actions during an Operation's execution

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

_Locks storage to protect against re-entrancy attacks.@author_

### unlock

```solidity
function unlock() external
```

_Only the original locker can unlock the contract at the end of the transaction_

### setInitiator

```solidity
function setInitiator(address _initiator) external
```

_Sets the initiator which is used to store flashloan nested return values in an isolated slice of state_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _initiator | address | Sets the initiator to Operation Executor contract when storing return values from flashloan nested Action |

### setOperationActions

```solidity
function setOperationActions(bytes32[] _actions) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _actions | bytes32[] | Stores the Actions currently being executed for a given Operation |

### verifyAction

```solidity
function verifyAction(bytes32 actionHash) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actionHash | bytes32 | Checks the current action has against the expected action hash |

### hasActionsToVerify

```solidity
function hasActionsToVerify() external view returns (bool)
```

_Custom operations have no Actions stored in Operation Registry_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Returns true / false depending on whether the Operation has any actions to verify the Operation against |

### push

```solidity
function push(bytes32 value) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | bytes32 | Pushes a bytes32 to end of the returnValues array |

### at

```solidity
function at(uint256 index, address who) external view returns (bytes32)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | The index of the desired value |
| who | address | The msg.sender address responsible for storing values |

### len

```solidity
function len(address who) external view returns (uint256)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| who | address | The msg.sender address responsible for storing values |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The length of return values stored against a given msg.sender address |

### clearStorage

```solidity
function clearStorage() external
```

_Clears storage in preparation for the next Operation_

