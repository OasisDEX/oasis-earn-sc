// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/Action.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IDaiJoin.sol";
import "../../interfaces/maker/IJug.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../libs/SafeMath.sol";

import {GenerateData} from "../../core/types/Maker.sol";

contract Generate is Action {
    using SafeMath for uint256;

    uint256 constant RAY = 10**27;

    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant JUG_ADDRESS =
        0x19c0976f590D67707E62397C87829d896Dc0f1F1;
    address public constant DAI_JOIN_ADDR =
        0x9759A6Ac90977b93B58547b4A71c78317f391A28;

    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory _paramsMapping)
        external
        payable
        override
    {
        GenerateData memory generateData = abi.decode(data, (GenerateData));

        IManager mcdManager = IManager(generateData.mcdManager);
        address vatAddr = mcdManager.vat();
        IVat vat = IVat(vatAddr);

        uint256 vaultId = pull(generateData.vaultId, _paramsMapping[2]);
        generateData.vaultId = vaultId;

        bytes32 generatedAmount = _generate(generateData, mcdManager, vat);

        push(generatedAmount);
    }

    function _generate(
        GenerateData memory data,
        IManager mcdManager,
        IVat vat
    ) internal returns (bytes32) {
        mcdManager.frob(
            data.vaultId,
            int256(0),
            _getDrawDart(
                address(vat),
                JUG_ADDRESS,
                mcdManager.urns(data.vaultId),
                mcdManager.ilks(data.vaultId),
                data.amount
            )
        );

        mcdManager.move(data.vaultId, address(this), toRad(data.amount));

        if (vat.can(address(this), address(DAI_JOIN_ADDR)) == 0) {
            vat.hope(DAI_JOIN_ADDR);
        }

        IDaiJoin(DAI_JOIN_ADDR).exit(data.to, data.amount);

        return bytes32(data.amount);
    }

    function _getDrawDart(
        address vat,
        address jug,
        address urn,
        bytes32 ilk,
        uint256 wad
    ) internal returns (int256 dart) {
        // Updates stability fee rate
        uint256 rate = IJug(jug).drip(ilk);

        // Gets DAI balance of the urn in the vat
        uint256 dai = IVat(vat).dai(urn);

        // If there was already enough DAI in the vat balance, just exits it without adding more debt
        if (dai < wad.mul(RAY)) {
            // Calculates the needed dart so together with the existing dai in the vat is enough to exit wad amount of DAI tokens
            dart = toInt256(wad.mul(RAY).sub(dai) / rate);
            // This is neeeded due lack of precision. It might need to sum an extra dart wei (for the given DAI wad amount)
            dart = uint256(dart).mul(rate) < wad.mul(RAY) ? dart + 1 : dart;
        }
    }

    function parseParamUint(
        uint256 param,
        uint256 paramMapping,
        OperationStorage txStorage
    ) internal view returns (uint256) {
        if (paramMapping > 0) {
            bytes32 value = txStorage.at(paramMapping - 1);

            return uint256(value);
        }

        return param;
    }

    function toInt256(uint256 x) internal pure returns (int256 y) {
        y = int256(x);
        require(y >= 0, "int256-overflow");
    }

    function convertTo18(address gemJoin, uint256 amt)
        internal
        view
        returns (uint256 wad)
    {
        // For those collaterals that have less than 18 decimals precision we need to do the conversion before passing to frob function
        // Adapters will automatically handle the difference of precision
        wad = amt.mul(10**(18 - IJoin(gemJoin).dec()));
    }

    function toRad(uint256 wad) internal pure returns (uint256 rad) {
        rad = wad.mul(10**27);
    }
}
