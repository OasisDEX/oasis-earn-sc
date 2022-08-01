import { utils } from 'ethers'
import { ParamType } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { ContractNames } from '../constants'

export class Action {
    name: ContractNames
    nameHash: string
    paramTypes: ParamType[]
    args: any
    subActions: Action[] = []
    paramMapping: number[] = []

    getParamTypes(abi: any): ParamType[] {    
        return new ethers.utils.Interface(abi)
        .functions['parseInputs(bytes)'].outputs![0].components
    }

    groupTypes(params: ParamType[]): string {
        const types: Array<string> = [];
        params.forEach((pt) => { 
            let type = pt.type
            if( type === 'tuple[]') {
                type = this.groupTypes(pt.components) + '[]'
            }
            return types.push(`${type} ${pt.name}`)
        })

        return `(${ types.join(", ") })`;
    }
    getParamsTuple() {
        return `tuple${ this.groupTypes(this.paramTypes) }`;
    }

    encodeCalldata() {
        const encodedArgs = ethers.utils.defaultAbiCoder.encode(
        [this.getParamsTuple()],
        [this.args]
        )
        const iface = new ethers.utils.Interface([
            ' function execute(bytes calldata data, uint8[] paramsMap) external payable returns (bytes calldata)',
        ])
        const callData = iface.encodeFunctionData('execute', [encodedArgs, this.paramMapping])

        return {
            callData,
            targetHash: this.nameHash
        }
    }

    constructor(name: ContractNames, args: any, paramMapping: number[] = []) {
      this.paramTypes = []
      this.name = name
      this.nameHash = utils.keccak256(utils.toUtf8Bytes(name))
      this.args = args
      this.paramMapping = paramMapping

      if( args.calls && args.calls.length > 0) {
        this.subActions = args.calls
      }
    }
}