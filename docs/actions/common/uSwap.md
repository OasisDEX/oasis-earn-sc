# Solidity API

## uSwap

### feeBeneficiaryAddress

```solidity
address feeBeneficiaryAddress
```

### feeBase

```solidity
uint256 feeBase
```

### feeTiers

```solidity
mapping(uint256 => bool) feeTiers
```

### authorizedAddresses

```solidity
mapping(address => bool) authorizedAddresses
```

### pools

```solidity
mapping(bytes32 => uint24) pools
```

### registry

```solidity
contract ServiceRegistry registry
```

### ReceivedLess

```solidity
error ReceivedLess(uint256 receiveAtLeast, uint256 received)
```

### Unauthorized

```solidity
error Unauthorized()
```

### FeeTierDoesNotExist

```solidity
error FeeTierDoesNotExist(uint256 fee)
```

### FeeTierAlreadyExists

```solidity
error FeeTierAlreadyExists(uint256 fee)
```

### SwapFailed

```solidity
error SwapFailed()
```

### constructor

```solidity
constructor(address authorisedCaller, address feeBeneficiary, uint256 _initialFee, address _registry) public
```

### AssetSwap

```solidity
event AssetSwap(address assetIn, address assetOut, uint256 amountIn, uint256 amountOut)
```

### FeePaid

```solidity
event FeePaid(address beneficiary, uint256 amount, address token)
```

### SlippageSaved

```solidity
event SlippageSaved(uint256 minimumPossible, uint256 actualAmount)
```

### FeeTierAdded

```solidity
event FeeTierAdded(uint256 fee)
```

### FeeTierRemoved

```solidity
event FeeTierRemoved(uint256 fee)
```

### SwapDescription

```solidity
struct SwapDescription {
  contract IERC20 srcToken;
  contract IERC20 dstToken;
  address payable srcReceiver;
  address payable dstReceiver;
  uint256 amount;
  uint256 minReturnAmount;
  uint256 flags;
  bytes permit;
}
```

### onlyAuthorised

```solidity
modifier onlyAuthorised()
```

### _addFeeTier

```solidity
function _addFeeTier(uint256 fee) private
```

### addFeeTier

```solidity
function addFeeTier(uint256 fee) public
```

### removeFeeTier

```solidity
function removeFeeTier(uint256 fee) public
```

### setPool

```solidity
function setPool(address fromToken, address toToken, uint24 pool) public
```

### getPool

```solidity
function getPool(address fromToken, address toToken) public view returns (uint24)
```

### verifyFee

```solidity
function verifyFee(uint256 feeId) public view returns (bool valid)
```

### _swap

```solidity
function _swap(address fromAsset, address toAsset, uint256 amount, uint256 receiveAtLeast) internal returns (uint256 balance)
```

### _collectFee

```solidity
function _collectFee(address asset, uint256 fromAmount, uint256 fee) internal returns (uint256 amount)
```

### compareMethodSigs

```solidity
function compareMethodSigs(bytes a, bytes b) internal pure returns (bool)
```

### decodeOneInchCallData

```solidity
function decodeOneInchCallData(bytes withData) public pure returns (uint256 minReturn)
```

### swapTokens

```solidity
function swapTokens(struct SwapData swapData) public returns (uint256)
```

