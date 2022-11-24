import { Call } from "../../core/types/Common.sol";

interface IEventEmitter {
  function emitActionEvent(
    string memory actionName,
    address msgSender,
    bytes calldata encodedReturnValues
  ) external;

  function emitOperationEvent(
    string memory operationName,
    address msgSender,
    Call[] calldata calls
  ) external;
}
