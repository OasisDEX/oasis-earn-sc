
import { createFork } from '../../utils/tenderly-fork'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'

describe('TENDERLY FORK TEMPLATE TEST', async () => {
  
  let provider: ethers.providers.JsonRpcProvider
  beforeEach(async () => {
    const forkId = await createFork('mainnet')
    provider = new ethers.providers.JsonRpcProvider(`https://rpc.tenderly.co/fork/${forkId}`)

    const signer = provider.getSigner()

    console.log('SIGNER ADDR', await signer.getAddress() );
    console.log('LAST BLOCK', await provider.getBlockNumber() );
    
    // save snapshot
    const checkpoint = provider.send("evm_snapshot", []);
 
    // revert back the checkpoint
    provider.send("evm_revert", [checkpoint]);
  })

  it('should run test', async () => {
   
    expect(true).to.be.true
  
  })
})
