// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../interfaces/IERC20.sol";
import "../../interfaces/mcd/IVat.sol";
import "../../interfaces/mcd/IDaiJoin.sol";
import "../../interfaces/mcd/IJoin.sol";
import "../../interfaces/mcd/IGem.sol";
import "../../interfaces/mcd/IManager.sol";
import "../../utils/SafeMath.sol";
import "./ActionBase.sol";
import "hardhat/console.sol";

contract Payback is IAction {
    using SafeMath for uint256;
    uint256 public constant RAY = 10**27;

    struct WipeDartParams {
        address vat;
        uint256 dai;
        address urn;
        bytes32 ilk;
    }

    struct WipeWadParams {
        address vat;
        address usr;
        address urn;
        bytes32 ilk;
    }

    struct PaybackParams {
        uint256 vaultId;
        address userAddress;
        address daiJoin;
        address mcdManager;
        uint256 amount;
        bool paybackAll;
    }

    function executeAction(
        bytes[] memory _callData,
        uint256[] memory _paramsMapping,
        bytes32[] memory _returnValues,
        uint256 fee
    ) public payable override returns (bytes32) {
        (
            uint256 vaultId,
            address userAddress,
            address daiJoin,
            address mcdManager,
            uint256 amount,
            bool paybackAll
        ) = parseInputs(_callData);

        vaultId = parseParamUint(vaultId, _paramsMapping[0], _returnValues);

        PaybackParams memory paybackParams = PaybackParams(
            vaultId,
            userAddress,
            daiJoin,
            mcdManager,
            amount,
            paybackAll
        );

        paybackAll ? _paybackAll(paybackParams) : _payback(paybackParams);

        return bytes32("");
    }

    function actionType() public pure override returns (uint8) {
        return uint8(ActionType.DEFAULT);
    }

    function _payback(PaybackParams memory params) internal returns (bytes32) {
        IManager mcdManager = IManager(params.mcdManager);

        address own = mcdManager.owns(params.vaultId);
        address urn = mcdManager.urns(params.vaultId);
        address vat = mcdManager.vat();
        bytes32 ilk = mcdManager.ilks(params.vaultId);

        if (
            own == address(this) ||
            mcdManager.cdpCan(own, params.vaultId, address(this)) == 1
        ) {
            // Joins DAI amount into the vat
            daiJoin_join(
                params.userAddress,
                params.daiJoin,
                urn,
                params.amount
            );
            // Paybacks debt to the CDP
            mcdManager.frob(
                params.vaultId,
                0,
                _getWipeDart(WipeDartParams(vat, IVat(vat).dai(urn), urn, ilk))
            );
        } else {
            // Joins DAI params.amount into the vat
            daiJoin_join(
                params.userAddress,
                params.daiJoin,
                address(this),
                params.amount
            );
            // Paybacks debt to the CDP
            uint256 wadToWipe = params.amount * RAY;
            IVat(vat).frob(
                ilk,
                urn,
                address(this),
                address(this),
                0,
                _getWipeDart(WipeDartParams(vat, wadToWipe, urn, ilk))
            );
        }

        return bytes32("");
    }

    function _paybackAll(PaybackParams memory params)
        internal
        returns (bytes32)
    {
        IManager mcdManager = IManager(params.mcdManager);

        address own = mcdManager.owns(params.vaultId);
        address urn = mcdManager.urns(params.vaultId);
        address vat = mcdManager.vat();
        bytes32 ilk = mcdManager.ilks(params.vaultId);
        (, uint256 art) = IVat(mcdManager.vat()).urns(ilk, urn);

        if (
            own == address(this) ||
            mcdManager.cdpCan(own, params.vaultId, address(this)) == 1
        ) {
            // Joins DAI amount into the vat
            daiJoin_join(
                params.userAddress,
                params.daiJoin,
                urn,
                _getWipeAllWad(WipeWadParams(vat, urn, urn, ilk))
            );
            // Paybacks debt to the CDP
            mcdManager.frob(params.vaultId, 0, -int256(art));
        } else {
            // Joins DAI params.amount into the vat
            daiJoin_join(
                params.userAddress,
                params.daiJoin,
                address(this),
                _getWipeAllWad(WipeWadParams(vat, address(this), urn, ilk))
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

    function parseInputs(bytes[] memory _callData)
        internal
        pure
        returns (
            uint256 vaultId,
            address userAddress,
            address daiJoin,
            address mcdManager,
            uint256 amount,
            bool paybackAll
        )
    {
        vaultId = abi.decode(_callData[0], (uint256));
        userAddress = abi.decode(_callData[1], (address));
        daiJoin = abi.decode(_callData[2], (address));
        mcdManager = abi.decode(_callData[3], (address));
        amount = abi.decode(_callData[4], (uint256));
        paybackAll = abi.decode(_callData[5], (bool));
    }

    function daiJoin_join(
        address userAddress,
        address apt,
        address urn,
        uint256 amount
    ) public {
        IGem dai = IDaiJoin(apt).dai();

        dai.transferFrom(userAddress, address(this), amount);

        // Approves adapter to take the DAI amount
        dai.approve(apt, amount);

        // Joins DAI into the vat
        IDaiJoin(apt).join(urn, amount);
    }

    function _getWipeDart(WipeDartParams memory params)
        internal
        view
        returns (int256 dart)
    {
        // Gets actual rate from the vat
        (, uint256 rate, , , ) = IVat(params.vat).ilks(params.ilk);

        // Gets actual art value of the urn
        (, uint256 art) = IVat(params.vat).urns(params.ilk, params.urn);

        dart = toInt(params.dai / rate);

        // Checks the calculated dart is not higher than urn.art (total debt), otherwise uses its value
        dart = uint256(dart) <= art ? -dart : -toInt(art);
    }

    function _getWipeAllWad(WipeWadParams memory params)
        internal
        view
        returns (uint256 wad)
    {
        // Gets actual rate from the vat
        (, uint256 rate, , , ) = IVat(params.vat).ilks(params.ilk);
        // Gets actual art value of the urn
        (, uint256 art) = IVat(params.vat).urns(params.ilk, params.urn);
        // Gets actual dai amount in the urn
        uint256 dai = IVat(params.vat).dai(params.usr);

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
