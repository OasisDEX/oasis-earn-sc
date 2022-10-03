// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./AccountGuard.sol";

contract AccountImplementation {
    AccountGuard public immutable guard;

    modifier auth() {
        require(
            guard.canCall(address(this), msg.sender),
            "account-guard/not-owner"
        );
        _;
    }

    constructor(AccountGuard _guard) {
        guard = _guard;
    }

    function execute(address _target, bytes memory _data)
        public
        payable
        auth
        returns (bytes32 response)
    {
        require(_target != address(0x0));

        // call contract in current context
        assembly {
            let succeeded := delegatecall(
                sub(gas(), 5000),
                _target,
                add(_data, 0x20),
                mload(_data),
                0,
                32
            )
            response := mload(0) // load delegatecall output
            switch iszero(succeeded)
            case 1 {
                // throw if delegatecall failed
                revert(0, 0)
            }
        }
    }
}
