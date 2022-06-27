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
import "../../interfaces/guni/IGUNIRouter.sol";
import "../../interfaces/guni/IGUNIResolver.sol";
import "../../interfaces/guni/IGUNIToken.sol";
import "../../interfaces/guni/IUniPool.sol";
import "../../libs/SafeMath.sol";



struct GuniWithdrawData {
  address joinAddress;
  address mcdManager;
  uint256 vaultId;
  uint256 amount;
}

contract GuniWithdraw is IAction {
  using SafeMath for uint256;
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  address public constant GUNI_ROUTER_02 = 0x14E6D67F824C3a7b4329d3228807f8654294e4bd;
  address public constant GUNI_DAI_USDC = 0xAbDDAfB225e10B90D798bB8A886238Fb835e2053;
  address public constant GUNI_RESOLVER = 0x0317650Af6f184344D7368AC8bB0bEbA5EDB214a;
  
  constructor(address _registry) IAction(_registry) {}

  function execute(bytes calldata data, uint8[] memory _paramsMapping) public payable override {
    GuniWithdrawData memory guniWithdrawData = abi.decode(data, (GuniWithdrawData));

    uint256 vaultId = pull(guniWithdrawData.vaultId, _paramsMapping[2]);
    guniWithdrawData.vaultId = vaultId;

    IGUNIToken guni = IGUNIToken(GUNI_DAI_USDC);

    uint256 guniBalance = guni.balanceOf(address(this));

    uint256 daiBal = IERC20(DAI).balanceOf(address(this));
    uint256 usdcBal = IERC20(USDC).balanceOf(address(this));

    {
      IGUNIRouter router = IGUNIRouter(GUNI_ROUTER_02);
      guni.approve(address(router), guniBalance);
      router.removeLiquidity(address(guni), guniBalance, 0, 0, address(this));
    }

    daiBal = IERC20(DAI).balanceOf(address(this));
    usdcBal = IERC20(USDC).balanceOf(address(this));

  }

}
