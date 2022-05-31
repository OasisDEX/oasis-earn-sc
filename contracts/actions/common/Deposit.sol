// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../../interfaces/IERC20.sol";
import "../../interfaces/mcd/IVat.sol";
import "../../interfaces/mcd/IJoin.sol";
import "../../interfaces/mcd/IGem.sol";
import "../../interfaces/mcd/IManager.sol";
import "../../utils/SafeMath.sol";
import "./ActionBase.sol";
import "hardhat/console.sol";

contract Deposit is ActionBase {
  using SafeMath for uint256;
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  function executeAction(
    bytes[] memory _callData,
    uint256[] memory _paramsMapping,
    bytes32[] memory _returnValues,
    uint256 fee
  ) public payable override returns (bytes32) {
    (uint256 vaultId, address joinAddr, address mcdManager, uint256 amount) = parseInputs(
      _callData
    );

    vaultId = parseParamUint(vaultId, _paramsMapping[0], _returnValues);
    _deposit(vaultId, amount, joinAddr, mcdManager);

    return bytes32("");
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
      gem.deposit{ value: address(this).balance }();
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

  function parseInputs(bytes[] memory _callData)
    internal
    pure
    returns (
      uint256 vaultId,
      address joinAddr,
      address mcdManager,
      uint256 amount
    )
  {
    vaultId = abi.decode(_callData[0], (uint256));
    joinAddr = abi.decode(_callData[1], (address));
    mcdManager = abi.decode(_callData[2], (address));
    amount = abi.decode(_callData[3], (uint256));
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
