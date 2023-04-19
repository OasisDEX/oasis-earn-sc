# Solidity API

## StoredOperation

```solidity
struct StoredOperation {
  bytes32[] actions;
  string name;
}
```

## OperationsRegistry

Stores the Actions that constitute a given Operation

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

Stores the Actions that constitute a given Operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOwner | address | The address of the new owner of the Operations Registry |

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

Adds an Operation's Actions keyed to a an operation name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The Operation name |
| actions | bytes32[] | An array the Actions the Operation consists of |

### getOperation

```solidity
function getOperation(string name) external view returns (bytes32[] actions)
```

Gets an Operation from the Registry

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name of the Operation |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| actions | bytes32[] | Returns an array of Actions |

