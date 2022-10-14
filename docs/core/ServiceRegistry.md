# Solidity API

## ServiceRegistry

Stores addresses of deployed contracts

### MAX_DELAY

```solidity
uint256 MAX_DELAY
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
function transferOwnership(address newOwner) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOwner | address | Transfers ownership of the registry to a new address |

### changeRequiredDelay

```solidity
function changeRequiredDelay(uint256 newDelay) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newDelay | uint256 | Updates the required delay before an change can be confirmed with a follow up t/x |

### getServiceNameHash

```solidity
function getServiceNameHash(string name) external pure returns (bytes32)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | Hashes the supplied name |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | Returns the hash of the name |

### addNamedService

```solidity
function addNamedService(bytes32 serviceNameHash, address serviceAddress) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| serviceNameHash | bytes32 | The hashed name |
| serviceAddress | address | The address stored for a given name |

### updateNamedService

```solidity
function updateNamedService(bytes32 serviceNameHash, address serviceAddress) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| serviceNameHash | bytes32 | The hashed name |
| serviceAddress | address | The address to update for a given name |

### removeNamedService

```solidity
function removeNamedService(bytes32 serviceNameHash) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| serviceNameHash | bytes32 | The hashed service name to remove |

### getRegisteredService

```solidity
function getRegisteredService(string serviceName) external view returns (address)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| serviceName | string | Get a service address by its name |

### getServiceAddress

```solidity
function getServiceAddress(bytes32 serviceNameHash) external view returns (address)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| serviceNameHash | bytes32 | Get a service address by the hash of its name |

### clearScheduledExecution

```solidity
function clearScheduledExecution(bytes32 scheduledExecution) external
```

_Voids any submitted changes that are yet to be confirmed by a follow-up transaction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| scheduledExecution | bytes32 | Clear any scheduled changes |

### ChangeScheduled

```solidity
event ChangeScheduled(bytes32 dataHash, uint256 scheduledFor, bytes data)
```

### ChangeApplied

```solidity
event ChangeApplied(bytes32 dataHash, uint256 appliedAt, bytes data)
```

### ChangeCancelled

```solidity
event ChangeCancelled(bytes32 dataHash)
```

### NamedServiceRemoved

```solidity
event NamedServiceRemoved(bytes32 nameHash)
```

