// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../../interfaces/IERC20.sol";
import "../../interfaces/mcd/IVat.sol";
import "../../interfaces/mcd/IJoin.sol";
import "../../interfaces/mcd/IDaiJoin.sol";
import "../../interfaces/mcd/IJug.sol";
import "../../interfaces/mcd/IGem.sol";
import "../../interfaces/mcd/IManager.sol";
import "../../utils/SafeMath.sol";
import "./ActionBase.sol";
import "hardhat/console.sol";

contract Generate is ActionBase {
  using SafeMath for uint256;

  uint256 constant RAY = 10**27;

  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address public constant JUG_ADDRESS = 0x19c0976f590D67707E62397C87829d896Dc0f1F1;
  address public constant DAI_JOIN_ADDR = 0x9759A6Ac90977b93B58547b4A71c78317f391A28;

  function executeAction(
    bytes[] memory _callData,
    uint256[] memory _paramsMapping,
    bytes32[] memory _returnValues,
    uint256 fee
  ) public payable override returns (bytes32) {
    (uint256 vaultId, address _mcdManager, address to, uint256 amount) = parseInputs(_callData);

    vaultId = parseParamUint(vaultId, _paramsMapping[0], _returnValues);

    IManager mcdManager = IManager(_mcdManager);
    address vatAddr = mcdManager.vat();

    IVat vat = IVat(vatAddr);
    _generate(vaultId, amount, to, mcdManager, vat);

    return bytes32(amount);
  }

  function actionType() public pure override returns (uint8) {
    return uint8(ActionType.DEFAULT);
  }

  function _generate(
    uint256 vaultId,
    uint256 amount,
    address to,
    IManager mcdManager,
    IVat vat
  ) internal returns (bytes32) {
    mcdManager.frob(
      vaultId,
      int256(0),
      _getDrawDart(
        address(vat),
        JUG_ADDRESS,
        mcdManager.urns(vaultId),
        mcdManager.ilks(vaultId),
        amount
      )
    );

    mcdManager.move(vaultId, address(this), toRad(amount));

    if (vat.can(address(this), address(DAI_JOIN_ADDR)) == 0) {
      vat.hope(DAI_JOIN_ADDR);
    }

    IDaiJoin(DAI_JOIN_ADDR).exit(to, amount);
  }

  function parseInputs(bytes[] memory _callData)
    internal
    pure
    returns (
      uint256 vaultId,
      address mcdManager,
      address to,
      uint256 amount
    )
  {
    vaultId = abi.decode(_callData[0], (uint256));
    mcdManager = abi.decode(_callData[1], (address));
    to = abi.decode(_callData[2], (address));
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

  function toRad(uint256 wad) internal pure returns (uint256 rad) {
    rad = wad.mul(10**27);
  }
}
