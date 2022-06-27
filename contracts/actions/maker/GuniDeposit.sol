// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IDaiJoin.sol";
import "../../interfaces/maker/IJug.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../interfaces/guni/IGUNIRouter.sol";
import "../../interfaces/guni/IGUNIResolver.sol";
import "../../interfaces/guni/IGUNIToken.sol";
import "../../interfaces/guni/IUniPool.sol";
import "../../libs/SafeMath.sol";


struct GuniDepositData {
  address joinAddress;
  address mcdManager;
  uint256 vaultId;
}

contract GuniDeposit is IAction {
  using SafeMath for uint256;

  uint256 constant RAY = 10**27;

  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address public constant JUG_ADDRESS = 0x19c0976f590D67707E62397C87829d896Dc0f1F1;
  address public constant DAI_JOIN_ADDR = 0x9759A6Ac90977b93B58547b4A71c78317f391A28;
  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  address public constant GUNI_ROUTER_02 = 0x14E6D67F824C3a7b4329d3228807f8654294e4bd;
  address public constant GUNI_DAI_USDC = 0xAbDDAfB225e10B90D798bB8A886238Fb835e2053;
  address public constant GUNI_RESOLVER = 0x0317650Af6f184344D7368AC8bB0bEbA5EDB214a;
  
  constructor(address _registry) IAction(_registry) {}

  function execute(bytes calldata data, uint8[] memory _paramsMapping) external payable override {
    GuniDepositData memory guniDepositData = abi.decode(data, (GuniDepositData));

    IManager mcdManager = IManager(guniDepositData.mcdManager);
    address vatAddr = mcdManager.vat();
    IVat vat = IVat(vatAddr);

    uint256 vaultId = pull(guniDepositData.vaultId, _paramsMapping[2]);
    guniDepositData.vaultId = vaultId;

    IGUNIRouter router = IGUNIRouter(GUNI_ROUTER_02);

    uint256 guniBalance;

    uint256 daiBal = IERC20(DAI).balanceOf(address(this));
    uint256 usdcBal = IERC20(USDC).balanceOf(address(this));

    IGUNIToken guni = IGUNIToken(GUNI_DAI_USDC);
    IGUNIResolver resolver = IGUNIResolver(GUNI_RESOLVER);
    (uint256 sqrtPriceX96, , , , , , ) = IUniPool(guni.pool()).slot0();

    
    uint256 otherTokenTo18Conv = 10**(18 - 6);
    uint256 amount;

    (, amount) = resolver.getRebalanceParams(
      address(guni),
      guni.token0() == DAI ? daiBal : 0,
      guni.token1() == DAI ? daiBal : 0,
      ((((sqrtPriceX96 * sqrtPriceX96) >> 96) * 1e18) >> 96) * otherTokenTo18Conv
    );
    
    IERC20(DAI).approve(address(router), daiBal);
    IERC20(USDC).approve(address(router), usdcBal);
    
    (, , guniBalance) = router.addLiquidity(
      GUNI_DAI_USDC,
      daiBal,
      usdcBal,
      0,
      0,
      address(this)
    );
  }

}
