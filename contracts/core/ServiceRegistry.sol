//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.1;
import "hardhat/console.sol";

contract ServiceRegistry {
  mapping(bytes32 => uint256) public lastExecuted;
  mapping(address => bool) private trustedAddresses;
  mapping(bytes32 => address) private namedService;
  address public owner;

  uint256 public requiredDelay = 0; //big enaugh that any power of miner over timestamp does not matter

  modifier validateInput(uint256 len) {
    require(msg.data.length == len, "illegal-padding");
    _;
  }

  modifier delayedExecution() {
    bytes32 operationHash = keccak256(msg.data);
    uint256 reqDelay = requiredDelay;

    if (lastExecuted[operationHash] == 0 && reqDelay > 0) {
      //not called before, scheduled for execution
      // solhint-disable-next-line not-rely-on-time
      lastExecuted[operationHash] = block.timestamp;
      emit ChangeScheduled(
        msg.data,
        operationHash,
        // solhint-disable-next-line not-rely-on-time
        block.timestamp + reqDelay
      );
    } else {
      require(
        // solhint-disable-next-line not-rely-on-time
        block.timestamp - reqDelay > lastExecuted[operationHash],
        "delay-to-small"
      );
      // solhint-disable-next-line not-rely-on-time
      emit ChangeApplied(msg.data, block.timestamp);
      _;
      lastExecuted[operationHash] = 0;
    }
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "only-owner");
    _;
  }

  constructor(uint256 initialDelay) {
    require(initialDelay < type(uint256).max, "risk-of-overflow");
    requiredDelay = initialDelay;
    owner = msg.sender;
  }

  function transferOwnership(address newOwner) public onlyOwner validateInput(36) delayedExecution {
    owner = newOwner;
  }

  function changeRequiredDelay(uint256 newDelay)
    public
    onlyOwner
    validateInput(36)
    delayedExecution
  {
    requiredDelay = newDelay;
  }

  function addTrustedAddress(address trustedAddress)
    public
    onlyOwner
    validateInput(36)
    delayedExecution
  {
    trustedAddresses[trustedAddress] = true;
  }

  function removeTrustedAddress(address trustedAddress) public onlyOwner validateInput(36) {
    trustedAddresses[trustedAddress] = false;
  }

  function isTrusted(address testedAddress) public view returns (bool) {
    return trustedAddresses[testedAddress];
  }

  function getServiceNameHash(string memory name) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(name));
  }

  function addNamedService(bytes32 serviceNameHash, address serviceAddress)
    public
    onlyOwner
    validateInput(68)
    delayedExecution
  {
    require(namedService[serviceNameHash] == address(0), "service-override");
    namedService[serviceNameHash] = serviceAddress;
  }

  function updateNamedService(bytes32 serviceNameHash, address serviceAddress)
    public
    onlyOwner
    validateInput(68)
    delayedExecution
  {
    require(namedService[serviceNameHash] != address(0), "service-does-not-exist");
    namedService[serviceNameHash] = serviceAddress;
  }

  function removeNamedService(bytes32 serviceNameHash) public onlyOwner validateInput(36) {
    require(namedService[serviceNameHash] != address(0), "service-does-not-exist");
    namedService[serviceNameHash] = address(0);
    emit RemoveApplied(serviceNameHash);
  }

  function getRegisteredService(string memory serviceName) public view returns (address) {
    address retVal = getServiceAddress(keccak256(abi.encodePacked(serviceName)));
    return retVal;
  }

  function getServiceAddress(bytes32 serviceNameHash) public view returns (address serviceAddress) {
    serviceAddress = namedService[serviceNameHash];
    require(serviceAddress != 0x0000000000000000000000000000000000000000, "no-such-service");
  }

  function clearScheduledExecution(bytes32 scheduledExecution) public onlyOwner validateInput(36) {
    require(lastExecuted[scheduledExecution] > 0, "execution-not-sheduled");
    lastExecuted[scheduledExecution] = 0;
    emit ChangeCancelled(scheduledExecution);
  }

  event ChangeScheduled(bytes data, bytes32 dataHash, uint256 firstPossibleExecutionTime);
  event ChangeCancelled(bytes32 data);
  event ChangeApplied(bytes data, uint256 firstPossibleExecutionTime);
  event RemoveApplied(bytes32 nameHash);
}
