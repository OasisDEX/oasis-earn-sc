pragma solidity ^0.8.1;

contract ContractA {
    uint8 public state;

    constructor(uint8 _state) {
        state = _state;
    }

    function changeState(uint8 newState) public {
        state = newState;
    }

    function getState() public view returns (uint8) {
        return state;
    }
}

abstract contract Callable {
    function execute(address action, uint8 newState) public {
        (bool success, ) = action.delegatecall(
            abi.encodeWithSignature("changeState(uint8)", newState)
        );
        require(success, "call-failed");
    }
}

contract Contract1B is Callable {
    uint8 public state;

    constructor(uint8 _state) {
        state = _state;
    }
}

contract Contract2B is Callable {}
