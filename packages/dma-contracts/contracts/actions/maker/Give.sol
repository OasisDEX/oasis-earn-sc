// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IVat } from "../../interfaces/maker/IVat.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { IJoin } from "../../interfaces/maker/IJoin.sol";
import { IDaiJoin } from "../../interfaces/maker/IDaiJoin.sol";
import { IJug } from "../../interfaces/maker/IJug.sol";
import { SafeMath } from "../../libs/SafeMath.sol";
import { MathUtils } from "../../libs/MathUtils.sol";
import { GiveData } from "../../core/types/Maker.sol";
import { CDP_MANAGER, MCD_JUG, MCD_JOIN_DAI } from "../../core/constants/Maker.sol";

import "hardhat/console.sol";

contract MakerGive is Executable, UseStore {
  using SafeMath for uint256;
  using Read for OperationStorage;
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
        
    GiveData memory giveData = parseInputs(data);
    giveData.vaultId = store().readUint(
      bytes32(giveData.vaultId),
      paramsMap[1],
      address(this)
    );    

    IManager manager = IManager(registry.getRegisteredService(CDP_MANAGER));
    manager.give(giveData.vaultId, giveData.to);
    
  }

  function parseInputs(bytes memory _callData) public pure returns (GiveData memory params) {
    return abi.decode(_callData, (GiveData));
  }
}
