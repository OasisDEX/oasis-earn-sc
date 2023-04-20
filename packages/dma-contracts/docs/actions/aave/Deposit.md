# Solidity API

## AaveDeposit

Deposits the specified asset as collateral on AAVE's lending pool

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

_Look at UseStore.sol to get additional info on paramsMapping_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the DepositData struct |
| paramsMap | uint8[] | Maps operation storage values by index (index offset by +1) to execute calldata params |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct DepositData params)
```

