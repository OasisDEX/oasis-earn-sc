# Solidity API

## AavePayback

Pays back a specified amount to AAVE's lending pool

### dWETH

```solidity
contract IVariableDebtToken dWETH
```

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

_Look at UseStore.sol to get additional info on paramsMapping.
The paybackAll flag - when passed - will signal the user wants to repay the full debt balance for a given asset_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the PaybackData struct |
| paramsMap | uint8[] | Maps operation storage values by index (index offset by +1) to execute calldata params |

