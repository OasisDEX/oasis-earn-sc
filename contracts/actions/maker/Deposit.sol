// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../libs/SafeMath.sol";

import { DepositData } from "../../core/Types.sol";

contract Deposit is IAction {
  using SafeMath for uint256;
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  constructor(address _registry) IAction(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    DepositData memory depositData = abi.decode(data, (DepositData));
    bytes32 depositAmount = _deposit(depositData);

    push(depositAmount);
  }

  function _deposit(DepositData memory data) internal returns (bytes32) {
    IGem gem = IJoin(data.joinAddress).gem();

    if (address(gem) == WETH) {
      // gem.deposit{ value: msg.value }(); // no longer in msg.value, because of the flashloan callback
      gem.deposit{ value: address(this).balance }();
    }

    uint256 balance = IERC20(address(gem)).balanceOf(address(this));

    IERC20(address(gem)).approve(data.joinAddress, balance);
    IJoin(data.joinAddress).join(address(this), balance);

    address vatAddr = IManager(data.mcdManager).vat();

    IVat vat = IVat(vatAddr);

    int256 convertedAmount = toInt256(convertTo18(data.joinAddress, balance));

    IManager mcdManager = IManager(data.mcdManager);

    vat.frob(
      mcdManager.ilks(data.vaultId),
      mcdManager.urns(data.vaultId),
      address(this),
      address(this),
      convertedAmount,
      0
    );

    return bytes32(uint256(convertedAmount));
  }

  function toInt256(uint256 x) internal pure returns (int256 y) {
    y = int256(x);
    require(y >= 0, "int256-overflow");
  }

  function convertTo18(address gemJoin, uint256 amt) internal view returns (uint256 wad) {
    // For those collaterals that have less than 18 decimals precision we need to do the conversion before passing to frob function
    // Adapters will automatically handle the difference of precision
    wad = amt.mul(10**(18 - IJoin(gemJoin).dec()));
  }
}
