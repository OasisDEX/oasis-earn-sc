# Solidity API

## MakerPayback

### WipeData

```solidity
struct WipeData {
  contract IVat vat;
  address usr;
  address urn;
  uint256 dai;
  bytes32 ilk;
}
```

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[] paramsMap) external payable
```

### _payback

```solidity
function _payback(contract IManager manager, contract IDaiJoin daiJoin, struct PaybackData data) internal returns (bytes32)
```

### _paybackAll

```solidity
function _paybackAll(contract IManager manager, contract IDaiJoin daiJoin, struct PaybackData data) internal returns (bytes32)
```

### joinDai

```solidity
function joinDai(address usr, contract IDaiJoin daiJoin, address urn, uint256 amount) public
```

### _getWipeDart

```solidity
function _getWipeDart(struct MakerPayback.WipeData data) internal view returns (int256 dart)
```

### _getWipeAllWad

```solidity
function _getWipeAllWad(struct MakerPayback.WipeData data) internal view returns (uint256 wad)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct PaybackData params)
```

