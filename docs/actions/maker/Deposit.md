# Solidity API

## MakerDeposit

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _deposit

```solidity
function _deposit(struct DepositData data) internal returns (bytes32)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct DepositData params)
```

