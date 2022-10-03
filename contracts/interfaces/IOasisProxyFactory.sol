pragma solidity >=0.8.1;

interface IOasisProxyFactory {
  function migrateMaker(uint256[] calldata) external returns (address);

  function migrateAdditionalVaults(uint256[] calldata cdpIds) external returns (address);
}
