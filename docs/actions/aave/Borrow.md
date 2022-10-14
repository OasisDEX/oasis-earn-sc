# Solidity API

## AaveBorrow

Borrows ETH from AAVE's lending pool

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
function execute(bytes data, uint8[]) external payable
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded calldata that conforms to the BorrowData struct |
|  | uint8[] |  |

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct BorrowData params)
```

