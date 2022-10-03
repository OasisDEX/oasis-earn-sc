// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";

contract Dummy{

    address immutable _self;

    constructor(){
        _self = address(this);
    }

    function call1() public{
        emit Narf(msg.sender, address(this), _self);
    }

    function call2() public{
        emit Point(msg.sender, address(this), _self);
    }

    event Narf(address sender, address thisAddress, address self);

    event Point(address sender, address thisAddress, address self);
    
}
