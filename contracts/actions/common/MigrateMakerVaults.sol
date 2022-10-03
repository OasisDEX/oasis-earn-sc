pragma solidity ^0.8.0;

import { Executable } from "../common/Executable.sol";
import { IOasisProxyFactory } from "../../interfaces/IOasisProxyFactory.sol";
import { MakerMigrationData } from "../../core/types/Common.sol";
import { MIGRATE_OASIS_ACTION } from "../../core/constants/Common.sol";
import "hardhat/console.sol";

contract MigrateMakerVaults is Executable {
  address public immutable factory;

  constructor(address _factory) {
    factory = _factory;
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    MakerMigrationData memory migrate = abi.decode(data, (MakerMigrationData));

    uint256[] memory cdpIds = migrate.cdpIds;
    (bool status, ) = address(factory).delegatecall(
      abi.encodeWithSelector(IOasisProxyFactory(factory).migrateMaker.selector, cdpIds)
    );
    require(status, "migrate-maker/failed");

    emit Action(MIGRATE_OASIS_ACTION, bytes32(cdpIds.length));
  }
}
