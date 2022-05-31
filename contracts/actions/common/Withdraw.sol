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
import "hardhat/console.sol";

contract Withdraw is IAction {
    using SafeMath for uint256;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    struct WithdrawParams {
        uint256 vaultId;
        address userAddress;
        address joinAddr;
        address mcdManager;
        uint256 amount;
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
            address joinAddr,
            address mcdManager,
            uint256 amount
        ) = parseInputs(_callData);

        vaultId = parseParamUint(vaultId, _paramsMapping[0], _returnValues);

        WithdrawParams memory withdrawParams = WithdrawParams(
            vaultId,
            userAddress,
            joinAddr,
            mcdManager,
            amount
        );

        _withdraw(withdrawParams);

        return bytes32("");
    }

    function actionType() public pure override returns (uint8) {
        return uint8(ActionType.DEFAULT);
    }

    function _withdraw(WithdrawParams memory params)
        internal
        returns (bytes32)
    {
        IGem gem = IJoin(params.joinAddr).gem();
        IManager manager = IManager(params.mcdManager);
        uint256 convertedAmount = convertTo18(params.joinAddr, params.amount);

        // Unlocks WETH/GEM amount from the CDP
        manager.frob(params.vaultId, -toInt(convertedAmount), 0);

        // Moves the amount from the CDP urn to proxy's address
        manager.flux(params.vaultId, address(this), convertedAmount);

        // Exits token/WETH amount to the user's wallet as a token
        IGem(params.joinAddr).exit(address(this), convertedAmount);

        if (address(gem) == WETH) {
            // Converts WETH to ETH
            IGem(params.joinAddr).gem().withdraw(convertedAmount);
            // Sends ETH back to the user's wallet
            payable(params.userAddress).transfer(convertedAmount);
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
            uint256 amount
        )
    {
        vaultId = abi.decode(_callData[0], (uint256));
        userAddress = abi.decode(_callData[1], (address));
        daiJoin = abi.decode(_callData[2], (address));
        mcdManager = abi.decode(_callData[3], (address));
        amount = abi.decode(_callData[4], (uint256));
    }

    function toInt(uint256 x) internal pure returns (int256 y) {
        y = int256(x);
        require(y >= 0, "int-overflow");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "mul-overflow");
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
