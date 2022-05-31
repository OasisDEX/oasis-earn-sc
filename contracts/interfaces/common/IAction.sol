pragma solidity ^0.8.1;

interface IAction {
    function execute(bytes calldata _data, uint8[] memory _paramsMapping)
        external
        payable
        returns (bytes calldata);
}
