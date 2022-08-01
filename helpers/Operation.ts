import { Contract } from "ethers";
import { Action } from "./actions/Action";
import { OPERATION_NAMES } from "./constants";

export class Operation {
    name: string
    actions: Action[] = []
    operationExecutor: Contract

  constructor(operationExecutor: Contract, name: string, actions: Action[] = []) {
    this.name = name
    this.operationExecutor = operationExecutor // could be read from addresses instead of passing
    this.actions = actions // could be a method, to do extra checks on each action
  }

  encodeActions(actions: Action[]) {
     return actions.map( (action:Action) => {
      if( action.subActions?.length > 0 ) {
        action.args.calls = this.encodeActions(action.subActions)
      }
      return action.encodeCalldata()
    })
  }

  encodeForProxyCall(): string {
    const actionsEncoded = this.encodeActions(this.actions);
    return this.operationExecutor.interface.encodeFunctionData('executeOp', [
      actionsEncoded,
      this.name,
    ])
  }

  executeThroughProxy(dsProxyAddress: string) {
      // await executeThroughProxy(
      //   system.common.dsProxy.address,
      //   {
      //     address: system.common.operationExecutor.address,
      //     calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
      //       [
      //         new actions.common.PullTokenAction([{
      //         amount: depositAmount.toFixed(0),
      //         asset: ADDRESSES.main.DAI,
      //         from: address,
      //       }]).encodeCalldata(),
      //       new actions.common.TakeFlashloanAction([{
      //         amount: flashloanAmount.toFixed(0),
      //         borrower: system.common.operationExecutor.address,
      //         dsProxyFlashloan: true,
      //         calls: [
              
      //         ],
      //       }]).encodeCalldata()
      //     ],
      //       OPERATION_NAMES.common.CUSTOM_OPERATION,
      //     ]),
      //   },
      //   signer,
      // )
  }


  // await executeThroughProxy(
  //   system.common.dsProxy.address,
  //   {
  //     address: system.common.operationExecutor.address,
  //     calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
  //       [
  //         new actions.common.PullTokenAction([{
  //         amount: depositAmount.toFixed(0),
  //         asset: ADDRESSES.main.DAI,
  //         from: address,
  //       }]).encodeCalldata(),
  //       new actions.common.TakeFlashloanAction([{
  //         amount: flashloanAmount.toFixed(0),
  //         borrower: system.common.operationExecutor.address,
  //         dsProxyFlashloan: true,
  //         calls: [
           
  //         ],
  //       }]).encodeCalldata()
  //     ],
  //       OPERATION_NAMES.common.CUSTOM_OPERATION,
  //     ]),
  //   },
  //   signer,
  // )

}