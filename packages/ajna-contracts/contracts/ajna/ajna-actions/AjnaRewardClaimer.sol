// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { RewardsManager } from "../RewardsManager.sol";
import { IAccountImplementation } from "../../interfaces/dpm/IAccountImplementation.sol";
import { IAccountGuard } from "../../interfaces/dpm/IAccountGuard.sol";
import { IServiceRegistry } from "../../interfaces/IServiceRegistry.sol";

interface IajnaProxyActions {
    function claimRewardsAndSendToOwner(address pool, uint256 tokenId) external;
}
error ApaAlreadyInitialized(address);
error NotOwner();
error CallerNotProxyOwner();
error OnlyNotDelegate();
error ApaNotWhitelisted(address);

contract AjnaRewardClaimer {
    RewardsManager public immutable rewardsManager;
    IAccountGuard public immutable guard;
    IERC20 public immutable ajnaToken;
    address public immutable self;
    address public immutable owner;
    address public ajnaProxyActions;

    /**
     * @dev Emitted once an Operation has completed execution
     * @param name Name of the operation
     **/
    event ProxyActionsOperation(bytes32 indexed name);

    event AjnaRewardClaimed(address indexed proxy, address indexed pool, uint256 indexed tokenId);

    constructor(RewardsManager _rewardsManager, IERC20 _ajnaToken, IServiceRegistry _serviceRegistry) {
        rewardsManager = _rewardsManager;
        ajnaToken = _ajnaToken;
        self = address(this);
        guard = IAccountGuard(_serviceRegistry.getRegisteredService("DPM_GUARD"));
        owner = msg.sender;
    }

    /**
     *  @notice Single use function to initialize the ajnaProxyActions address
     *  @param  _ajnaProxyActions  ajnaProxyActions address
     */
    function initializeAjnaProxyActions(address _ajnaProxyActions) public {
        if (guard.isWhitelisted(_ajnaProxyActions)) {
            revert ApaNotWhitelisted(ajnaProxyActions);
        }
        if (ajnaProxyActions != address(0)) {
            revert ApaAlreadyInitialized(ajnaProxyActions);
        }
        if (msg.sender != owner) {
            revert NotOwner();
        }
        ajnaProxyActions = _ajnaProxyActions;
    }

    /**
     *  @notice Claim staking rewards for the given tokenIds and send them to the owner of the proxy
     *  @param  tokenIds     Array of tokenIds to claim rewards for
     */
    function claimRewardsAndSendToOwner(uint256[] memory tokenIds) public returns (bytes[] memory results) {
        _revertOnlyNotDelegate();
        uint256 loopCounter = tokenIds.length;
        results = new bytes[](tokenIds.length);
        for (uint256 i; i < loopCounter; i++) {
            (address proxy, address pool, ) = rewardsManager.getStakeInfo(tokenIds[i]);
            address proxyOwner = IAccountImplementation(proxy).owner();
            _revertCallerNotProxyOwner(proxyOwner);
            bytes memory rewardsManagerCalldata = abi.encodeWithSelector(
                IajnaProxyActions.claimRewardsAndSendToOwner.selector,
                pool,
                tokenIds[i]
            );
            IAccountImplementation(proxy).execute(ajnaProxyActions, rewardsManagerCalldata);
            ajnaToken.transfer(proxyOwner, ajnaToken.balanceOf(self));
            emit AjnaRewardClaimed(proxy, pool, tokenIds[i]);
        }
        emit ProxyActionsOperation("AjnaRewardClaimed");
    }

    function _revertOnlyNotDelegate() private view {
        if (address(this) != self) {
            revert OnlyNotDelegate();
        }
    }

    function _revertCallerNotProxyOwner(address _proxyOwner) private view {
        if (msg.sender != _proxyOwner) {
            revert CallerNotProxyOwner();
        }
    }
}
