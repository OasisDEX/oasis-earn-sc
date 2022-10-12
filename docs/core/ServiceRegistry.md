# Solidity API

## ServiceRegistry

Stores addresses of deployed contracts

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

