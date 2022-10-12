# Solidity API

## MakerGenerate

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _generate

```solidity
function _generate(struct GenerateData data) internal returns (bytes32)
```

### _getDrawDart

```solidity
function _getDrawDart(contract IVat vat, address jug, address urn, bytes32 ilk, uint256 wad) internal returns (int256 dart)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct GenerateData params)
```

