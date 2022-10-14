# Solidity API

## PullToken

Pulls token from a target address to the current calling context

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

_Is intended to pull tokens in to a user's proxy (the calling context)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the PullTokenData struct |
|  | uint8[] |  |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct PullTokenData params)
```

