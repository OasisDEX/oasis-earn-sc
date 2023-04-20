# Solidity API

## SendToken

Transfer token from the calling contract to the destination address

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the SendTokenData struct |
|  | uint8[] |  |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct SendTokenData params)
```

