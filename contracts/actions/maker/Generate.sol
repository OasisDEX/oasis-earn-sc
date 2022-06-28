// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IVat } from "../../interfaces/maker/IVat.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { IJoin } from "../../interfaces/maker/IJoin.sol"; // TODO:
import { IDaiJoin } from "../../interfaces/maker/IDaiJoin.sol";
import { IJug } from "../../interfaces/maker/IJug.sol";
import { SafeMath } from "../../libs/SafeMath.sol";
import { MathUtils } from "../../libs/MathUtils.sol";
import { GenerateData } from "../../core/types/Maker.sol";
import { MCD_MANAGER } from "../../core/constants/Maker.sol";

contract MakerGenerate is Executable, UseStore {
  using SafeMath for uint256;
  using Read for OperationStorage;
  using Write for OperationStorage;

  // TODO: NO GOOD
  address public constant JUG_ADDRESS = 0x19c0976f590D67707E62397C87829d896Dc0f1F1;
  address public constant DAI_JOIN_ADDR = 0x9759A6Ac90977b93B58547b4A71c78317f391A28;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    GenerateData memory generateData = abi.decode(data, (GenerateData));

    generateData.vaultId = store().readUint(bytes32(generateData.vaultId), paramsMap[0]);

    store().write(_generate(generateData));
  }

  function _generate(GenerateData memory data) internal returns (bytes32) {
    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));
    IVat vat = IVat(manager.vat());

    manager.frob(
      data.vaultId,
      int256(0),
      _getDrawDart(
        vat,
        JUG_ADDRESS,
        manager.urns(data.vaultId),
        manager.ilks(data.vaultId),
        data.amount
      )
    );

    manager.move(data.vaultId, address(this), toRad(data.amount));

    if (vat.can(address(this), address(DAI_JOIN_ADDR)) == 0) {
      vat.hope(DAI_JOIN_ADDR);
    }

    IDaiJoin(DAI_JOIN_ADDR).exit(data.to, data.amount);

    return bytes32(data.amount);
  }

  function _getDrawDart(
    IVat vat,
    address jug,
    address urn,
    bytes32 ilk,
    uint256 wad
  ) internal returns (int256 dart) {
    // Updates stability fee rate
    uint256 rate = IJug(jug).drip(ilk);

    // Gets DAI balance of the urn in the vat
    uint256 dai = vat.dai(urn);

    // If there was already enough DAI in the vat balance, just exits it without adding more debt
    if (dai < wad.mul(MathUtils.RAY)) {
      // Calculates the needed dart so together with the existing dai in the vat is enough to exit wad amount of DAI tokens
      dart = MathUtils.uintToInt(wad.mul(MathUtils.RAY).sub(dai) / rate);
      // This is neeeded due lack of precision. It might need to sum an extra dart wei (for the given DAI wad amount)
      dart = uint256(dart).mul(rate) < wad.mul(MathUtils.RAY) ? dart + 1 : dart;
    }
  }

  // TODO:
  function toRad(uint256 wad) internal pure returns (uint256 rad) {
    rad = wad.mul(10**27);
  }
}
