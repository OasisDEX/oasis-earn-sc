// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../libs/SafeMath.sol";
import {DepositData} from "../../core/types/Maker.sol";

contract Deposit is IAction {
    using SafeMath for uint256;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    function execute(bytes calldata _data)
        external
        payable
        override
        returns (bytes memory)
    {
        DepositData memory depositData = abi.decode(_data, (DepositData));
        _deposit(depositData);

        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );

        txStorage.push(bytes32(""));
        return "";
    }

    function actionType() public pure override returns (uint8) {
        return uint8(ActionType.DEFAULT);
    }

    function _deposit(
        uint256 vaultId,
        uint256 amount,
        address _joinAddr,
        // address _from,
        address _mcdManager
    ) internal returns (bytes32) {
        IGem gem = IJoin(_joinAddr).gem();

        if (address(gem) == WETH) {
            // gem.deposit{ value: msg.value }(); // no longer in msg.value, because of the flashloan callback
            gem.deposit{value: address(this).balance}();
        }

        uint256 balance = IERC20(address(gem)).balanceOf(address(this));
        IERC20(address(gem)).approve(_joinAddr, balance);
        IJoin(_joinAddr).join(address(this), balance);
        address vatAddr = IManager(_mcdManager).vat();

        IVat vat = IVat(vatAddr);

        int256 convertedAmount = toInt256(convertTo18(_joinAddr, balance));

        IManager mcdManager = IManager(_mcdManager);

        vat.frob(
            mcdManager.ilks(vaultId),
            mcdManager.urns(vaultId),
            address(this),
            address(this),
            convertedAmount,
            0
        );
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
}
