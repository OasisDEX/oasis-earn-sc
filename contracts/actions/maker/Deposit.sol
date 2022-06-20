// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import "../common/Executable.sol";
import "../common/UseStore.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../libs/SafeMath.sol";

import { DepositData } from "../../core/types/Maker.sol";
import { WETH } from "../../core/constants/Common.sol";
import { DEPOSIT_ACTION } from "../../core/constants/Maker.sol";

contract MakerDeposit is Executable, UseStore {
  using SafeMath for uint256;
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    emit Started(DEPOSIT_ACTION, data, paramsMap);
    DepositData memory depositData = abi.decode(data, (DepositData));
    depositData.vaultId = uint256(store().read(bytes32(depositData.vaultId), paramsMap[0]));

    bytes32 amountDeposited = _deposit(depositData);
    emit Completed(DEPOSIT_ACTION, amountDeposited);
    store().write(amountDeposited);
  }

  function _deposit(DepositData memory data) internal returns (bytes32) {
    IGem gem = IJoin(data.joinAddress).gem();

    if (address(gem) == registry.getRegisteredService(WETH)) {
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
