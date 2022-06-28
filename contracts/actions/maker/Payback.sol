// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IERC20 } from "../../interfaces/tokens/IERC20.sol";
import { IVat } from "../../interfaces/maker/IVat.sol";
import { IDaiJoin } from "../../interfaces/maker/IDaiJoin.sol";
import { IJoin } from "../../interfaces/maker/IJoin.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { SafeMath } from "../../libs/SafeMath.sol";
import { PaybackData } from "../../core/types/Maker.sol";
import { MathUtils } from "../../libs/MathUtils.sol";

contract MakerPayback is Executable, UseStore {
  using SafeMath for uint256;
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

  function execute(bytes calldata data, uint8[] memory _paramsMapping) external payable override {
    PaybackData memory paybackData = abi.decode(data, (PaybackData));
    paybackData.vaultId = uint256(store().read(bytes32(paybackData.vaultId), _paramsMapping[0]));
    paybackData.paybackAll ? _paybackAll(paybackData) : _payback(paybackData);

    store().write(bytes32(paybackData.amount));
  }

  function _payback(PaybackData memory data) internal returns (bytes32) {
    IManager mcdManager = data.mcdManager;

    address own = mcdManager.owns(data.vaultId);
    address urn = mcdManager.urns(data.vaultId);
    IVat vat = IVat(mcdManager.vat());
    bytes32 ilk = mcdManager.ilks(data.vaultId);

    if (own == address(this) || mcdManager.cdpCan(own, data.vaultId, address(this)) == 1) {
      // Joins DAI amount into the vat
      daiJoin_join(data.userAddress, IDaiJoin(address(data.daiJoin)), urn, data.amount); // TODO:
      // Paybacks debt to the CDP
      mcdManager.frob(data.vaultId, 0, _getWipeDart(WipeData(vat, urn, urn, vat.dai(urn), ilk)));
    } else {
      // Joins DAI params.amount into the vat
      daiJoin_join(data.userAddress, IDaiJoin(address(data.daiJoin)), address(this), data.amount); // TODO:
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

    return bytes32("");
  }

  function _paybackAll(PaybackData memory data) internal returns (bytes32) {
    IManager mcdManager = data.mcdManager;

    address own = mcdManager.owns(data.vaultId);
    address urn = mcdManager.urns(data.vaultId);
    IVat vat = IVat(mcdManager.vat());
    bytes32 ilk = mcdManager.ilks(data.vaultId);
    (, uint256 art) = vat.urns(ilk, urn);

    if (own == address(this) || mcdManager.cdpCan(own, data.vaultId, address(this)) == 1) {
      // Joins DAI amount into the vat
      daiJoin_join(
        data.userAddress,
        IDaiJoin(address(data.daiJoin)), // TODO:
        urn,
        _getWipeAllWad(WipeData(vat, urn, urn, 0, ilk))
      );
      // Paybacks debt to the CDP
      mcdManager.frob(data.vaultId, 0, -int256(art));
    } else {
      // Joins DAI data.amount into the vat
      daiJoin_join(
        data.userAddress,
        IDaiJoin(address(data.daiJoin)), // TODO:
        address(this),
        _getWipeAllWad(WipeData(vat, address(this), urn, 0, ilk))
      );
      // Paybacks debt to the CDP
      vat.frob(ilk, urn, address(this), address(this), 0, -int256(art));
    }

    return bytes32("");
  }

  // TODO: fix name
  function daiJoin_join(
    address usr,
    IDaiJoin daiJoin,
    address urn,
    uint256 amount
  ) public {
    IERC20 dai = IERC20(IDaiJoin(daiJoin).dai());

    dai.transferFrom(usr, address(this), amount);

    // Approves adapter to take the DAI amount
    dai.approve(address(daiJoin), amount);

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

    uint256 rad = art.mul(rate).sub(dai);
    wad = rad / MathUtils.RAY;

    // If the rad precision has some dust, it will need to request for 1 extra wad wei
    wad = wad.mul(MathUtils.RAY) < rad ? wad + 1 : wad;
  }
}
