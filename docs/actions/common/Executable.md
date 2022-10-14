# Solidity API

## Executable

Provides a common interface for an execute method to all Action

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
| returned | bytes32 | The bytes32 value returned by the Action |

