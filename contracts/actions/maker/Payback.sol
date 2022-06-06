// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IDaiJoin.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../libs/SafeMath.sol";

import {PaybackData} from "../../core/types/Maker.sol";

contract Payback is IAction {
    using SafeMath for uint256;
    uint256 public constant RAY = 10**27;

    struct WipeData {
        address vat;
        address usr;
        address urn;
        uint256 dai;
        bytes32 ilk;
    }

    constructor(address _registry) IAction(_registry) {}

    function execute(bytes calldata data, uint8[] memory _paramsMapping)
        public
        payable
        override
    {
        PaybackData memory paybackData = abi.decode(data, (PaybackData));
        uint256 vaultId = pull(paybackData.vaultId, _paramsMapping[0]);
        paybackData.vaultId = vaultId;

        paybackData.paybackAll
            ? _paybackAll(paybackData)
            : _payback(paybackData);

        push(bytes32(paybackData.amount));
    }

    function _payback(PaybackData memory data) internal returns (bytes32) {
        IManager mcdManager = IManager(data.mcdManager);

        address own = mcdManager.owns(data.vaultId);
        address urn = mcdManager.urns(data.vaultId);
        address vat = mcdManager.vat();
        bytes32 ilk = mcdManager.ilks(data.vaultId);

        if (
            own == address(this) ||
            mcdManager.cdpCan(own, data.vaultId, address(this)) == 1
        ) {
            // Joins DAI amount into the vat
            daiJoin_join(data.userAddress, data.daiJoin, urn, data.amount);
            // Paybacks debt to the CDP
            mcdManager.frob(
                data.vaultId,
                0,
                _getWipeDart(WipeData(vat, urn, urn, IVat(vat).dai(urn), ilk))
            );
        } else {
            // Joins DAI params.amount into the vat
            daiJoin_join(
                data.userAddress,
                data.daiJoin,
                address(this),
                data.amount
            );
            // Paybacks debt to the CDP
            uint256 wadToWipe = data.amount * RAY;
            IVat(vat).frob(
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
        IManager mcdManager = IManager(data.mcdManager);

        address own = mcdManager.owns(data.vaultId);
        address urn = mcdManager.urns(data.vaultId);
        address vat = mcdManager.vat();
        bytes32 ilk = mcdManager.ilks(data.vaultId);
        (, uint256 art) = IVat(mcdManager.vat()).urns(ilk, urn);

        if (
            own == address(this) ||
            mcdManager.cdpCan(own, data.vaultId, address(this)) == 1
        ) {
            // Joins DAI amount into the vat
            daiJoin_join(
                data.userAddress,
                data.daiJoin,
                urn,
                _getWipeAllWad(WipeData(vat, urn, urn, 0, ilk))
            );
            // Paybacks debt to the CDP
            mcdManager.frob(data.vaultId, 0, -int256(art));
        } else {
            // Joins DAI data.amount into the vat
            daiJoin_join(
                data.userAddress,
                data.daiJoin,
                address(this),
                _getWipeAllWad(WipeData(vat, address(this), urn, 0, ilk))
            );
            // Paybacks debt to the CDP
            IVat(vat).frob(
                ilk,
                urn,
                address(this),
                address(this),
                0,
                -int256(art)
            );
        }

        return bytes32("");
    }

    function daiJoin_join(
        address usr,
        address daiJoin,
        address urn,
        uint256 amount
    ) public {
        IGem dai = IDaiJoin(daiJoin).dai();

        dai.transferFrom(usr, address(this), amount);

        // Approves adapter to take the DAI amount
        dai.approve(daiJoin, amount);

        // Joins DAI into the vat
        IDaiJoin(daiJoin).join(urn, amount);
    }

    function _getWipeDart(WipeData memory data)
        internal
        view
        returns (int256 dart)
    {
        // Gets actual rate from the vat
        (, uint256 rate, , , ) = IVat(data.vat).ilks(data.ilk);

        // Gets actual art value of the urn
        (, uint256 art) = IVat(data.vat).urns(data.ilk, data.urn);

        dart = toInt(data.dai / rate);

        // Checks the calculated dart is not higher than urn.art (total debt), otherwise uses its value
        dart = uint256(dart) <= art ? -dart : -toInt(art);
    }

    function _getWipeAllWad(WipeData memory data)
        internal
        view
        returns (uint256 wad)
    {
        // Gets actual rate from the vat
        (, uint256 rate, , , ) = IVat(data.vat).ilks(data.ilk);
        // Gets actual art value of the urn
        (, uint256 art) = IVat(data.vat).urns(data.ilk, data.urn);
        // Gets actual dai amount in the urn
        uint256 dai = IVat(data.vat).dai(data.usr);

        uint256 rad = sub(mul(art, rate), dai);
        wad = rad / RAY;

        // If the rad precision has some dust, it will need to request for 1 extra wad wei
        wad = mul(wad, RAY) < rad ? wad + 1 : wad;
    }

    function toInt(uint256 x) internal pure returns (int256 y) {
        y = int256(x);
        require(y >= 0, "int-overflow");
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "sub-overflow");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "mul-overflow");
    }
}
