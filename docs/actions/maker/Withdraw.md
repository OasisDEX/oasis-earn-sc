# Solidity API

## MakerWithdraw

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _withdraw

```solidity
function _withdraw(struct WithdrawData data) internal returns (bytes32)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct WithdrawData params)
```

