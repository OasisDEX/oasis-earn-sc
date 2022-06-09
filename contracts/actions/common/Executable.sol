pragma solidity ^0.8.1;

interface Executable {
    function execute(bytes calldata data) external payable;
}
