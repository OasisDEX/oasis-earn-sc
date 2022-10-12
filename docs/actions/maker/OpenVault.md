# Solidity API

## MakerOpenVault

### constructor

```solidity
constructor(address _registry) public
```

### execute

```solidity
function execute(bytes data, uint8[]) external payable
```

### _openVault

```solidity
function _openVault(struct OpenVaultData data) internal returns (bytes32)
```

### parseInputs

```solidity
function parseInputs(bytes _callData) public pure returns (struct OpenVaultData params)
```

