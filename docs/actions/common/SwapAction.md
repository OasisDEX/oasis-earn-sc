# Solidity API

## SwapAction

Call the deployed Swap contract which handles swap execution

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

_The swap contract is pre-configured to use a specific exchange (EG 1inch)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the SwapData struct |
|  | uint8[] |  |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct SwapData params)
```

