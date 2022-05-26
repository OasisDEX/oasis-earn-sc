pragma solidity ^0.8.1;

interface IAction {
    function execute(bytes calldata data)
        external
        payable
        returns (bytes calldata);
}
