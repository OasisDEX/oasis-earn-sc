# Solidity API

## UseStore

Provides access to the OperationStorage contract

_Is used by Action contracts to store and retrieve values from Operation Storage.
Previously stored values are used to override values passed to Actions during Operation execution_

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

