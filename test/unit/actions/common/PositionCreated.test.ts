<<<<<<<< HEAD:packages/dupa-library/test/common/PositionCreated.test.ts
import { calldataTypes } from '@dupa-library'
import { createDeploy } from '@oasisdex/dupa-common/utils/deploy'
import init from '@oasisdex/dupa-common/utils/init'
========
import { createDeploy } from '@helpers/deploy'
import init from '@helpers/init'
import { calldataTypes } from '@oasisdex/oasis-actions'
>>>>>>>> dev:test/unit/actions/common/PositionCreated.test.ts
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

describe('PositionCreated Action', () => {
  let positionCreated: Contract

  before(async () => {
    const config = await init()
    const deploy = await createDeploy({ config })

    const [_positionCreated] = await deploy('PositionCreated', [])
    positionCreated = _positionCreated
  })

  it('should emit position created event', async () => {
    const mockArgs = {
      proxyAddress: '0xad5E5BfD4E54E27886aAA76e4654Ac455A649713',
      positionId: 123,
      protocol: 'AAVE',
      positionType: 'Earn',
      collateralToken: '0xae70aC637EC040BA9E5920307147dbB6BC1ade2F',
      debtToken: '0xaf548d2509B65711D7856de9fa18611b4390a514',
    }
    const tx = positionCreated.execute(
      ethers.utils.defaultAbiCoder.encode([calldataTypes.common.PositionCreated], [mockArgs]),
      [],
    )

    const abi = [
      'event CreatePosition (address indexed proxyAddress, uint256 indexed positionId, string protocol, string positionType, address collateralToken, address debtToken)',
    ]

    const iface = new ethers.utils.Interface(abi)

    const txReceipt = await (await tx).wait()
    const parsedLog = iface.parseLog(txReceipt.logs[0])
    expect(parsedLog.name).to.equal('CreatePosition')
    expect(parsedLog.args[0]).to.equal(mockArgs.proxyAddress)
    expect(parsedLog.args[1]).to.equal(mockArgs.positionId)
    expect(parsedLog.args[2]).to.equal(mockArgs.protocol)
    expect(parsedLog.args[3]).to.equal(mockArgs.positionType)
    expect(parsedLog.args[4]).to.equal(mockArgs.collateralToken)
    expect(parsedLog.args[5]).to.equal(mockArgs.debtToken)
  })
})
