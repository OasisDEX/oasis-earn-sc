# Solidity API

## TakeFlashloan

Executes a sequence of Actions after flashloaning funds

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

_When the Flashloan lender calls back the Operation Executor we may need to re-establish the calling context.
The isProxyFlashloan flag is used to give the Operation Executor temporary authority to call the execute method on a user's proxy_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the FlashloanData struct |
|  | uint8[] |  |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct FlashloanData params)
```

