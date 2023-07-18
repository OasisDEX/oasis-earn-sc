// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IVat } from "../../interfaces/maker/IVat.sol";
import { IDaiJoin } from "../../interfaces/maker/IDaiJoin.sol";
import { IJoin } from "../../interfaces/maker/IJoin.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { PaybackData } from "../../core/types/Maker.sol";
import { MathUtils } from "../../libs/MathUtils.sol";
import { MCD_MANAGER, MCD_JOIN_DAI } from "../../core/constants/Maker.sol";

contract MakerPayback is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;
  using Write for OperationStorage;

  struct WipeData {
    IVat vat;
    address usr;
    address urn;
    uint256 dai;
    bytes32 ilk;
  }

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    PaybackData memory paybackData = parseInputs(data);
    paybackData.vaultId = uint256(
      store().read(bytes32(paybackData.vaultId), paramsMap[0], address(this))
    );
    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));
    IDaiJoin daiJoin = IDaiJoin(registry.getRegisteredService(MCD_JOIN_DAI));
    uint256 amountPaidBack = paybackData.paybackAll
      ? _paybackAll(manager, daiJoin, paybackData)
      : _payback(manager, daiJoin, paybackData);

    store().write(bytes32(amountPaidBack));
  }

  function _payback(
    IManager manager,
    IDaiJoin daiJoin,
    PaybackData memory data
  ) internal returns (uint256) {
    address own = manager.owns(data.vaultId);
    address urn = manager.urns(data.vaultId);
    IVat vat = manager.vat();
    bytes32 ilk = manager.ilks(data.vaultId);

    if (own == address(this) || manager.cdpCan(own, data.vaultId, address(this)) == 1) {
      // Joins DAI amount into the vat
      joinDai(data.userAddress, daiJoin, urn, data.amount);
      // Paybacks debt to the CDP
      manager.frob(data.vaultId, 0, _getWipeDart(WipeData(vat, urn, urn, vat.dai(urn), ilk)));
    } else {
      // Joins DAI params.amount into the vat
      joinDai(data.userAddress, daiJoin, address(this), data.amount);
      // Paybacks debt to the CDP
      uint256 wadToWipe = data.amount * MathUtils.RAY;
      vat.frob(
        ilk,
        urn,
        address(this),
        address(this),
        0,
        _getWipeDart(WipeData(vat, urn, urn, wadToWipe, ilk))
      );
    }

    return data.amount;
  }

  function _paybackAll(
    IManager manager,
    IDaiJoin daiJoin,
    PaybackData memory data
  ) internal returns (uint256) {
    address own = manager.owns(data.vaultId);
    address urn = manager.urns(data.vaultId);
    bytes32 ilk = manager.ilks(data.vaultId);
    IVat vat = manager.vat();
    (, uint256 art) = vat.urns(ilk, urn);

    if (own == address(this) || manager.cdpCan(own, data.vaultId, address(this)) == 1) {
      // Joins DAI amount into the vat
      joinDai(data.userAddress, daiJoin, urn, _getWipeAllWad(WipeData(vat, urn, urn, 0, ilk)));
      // Paybacks debt to the CDP
      manager.frob(data.vaultId, 0, -int256(art));
    } else {
      // Joins DAI data.amount into the vat
      joinDai(
        data.userAddress,
        daiJoin,
        address(this),
        _getWipeAllWad(WipeData(vat, address(this), urn, 0, ilk))
      );
      // Paybacks debt to the CDP
      vat.frob(ilk, urn, address(this), address(this), 0, -int256(art));
    }

    return uint256(art);
  }

  function joinDai(address usr, IDaiJoin daiJoin, address urn, uint256 amount) public {
    IERC20 dai = IERC20(daiJoin.dai());

    dai.safeTransferFrom(usr, address(this), amount);

    // Approves adapter to take the DAI amount
    dai.safeApprove(address(daiJoin), amount);

    // Joins DAI into the vat
    daiJoin.join(urn, amount);
  }

  function _getWipeDart(WipeData memory data) internal view returns (int256 dart) {
    // Gets actual rate from the vat
    (, uint256 rate, , , ) = IVat(data.vat).ilks(data.ilk);

    // Gets actual art value of the urn
    (, uint256 art) = IVat(data.vat).urns(data.ilk, data.urn);

    dart = MathUtils.uintToInt(data.dai / rate);

    // Checks the calculated dart is not higher than urn.art (total debt), otherwise uses its value
    dart = uint256(dart) <= art ? -dart : -MathUtils.uintToInt(art);
  }

  function _getWipeAllWad(WipeData memory data) internal view returns (uint256 wad) {
    // Gets actual rate from the vat
    (, uint256 rate, , , ) = data.vat.ilks(data.ilk);
    // Gets actual art value of the urn
    (, uint256 art) = data.vat.urns(data.ilk, data.urn);
    // Gets actual dai amount in the urn
    uint256 dai = data.vat.dai(data.usr);

    uint256 rad = (art * rate) - dai;
    wad = rad / MathUtils.RAY;

    // If the rad precision has some dust, it will need to request for 1 extra wad wei
    wad = wad * MathUtils.RAY < rad ? wad + 1 : wad;
  }

  function parseInputs(bytes memory _callData) public pure returns (PaybackData memory params) {
    return abi.decode(_callData, (PaybackData));
  }
}
