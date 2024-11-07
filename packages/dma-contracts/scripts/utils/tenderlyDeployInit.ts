export const tenderlyDeployInit = async provider => {
  console.log('> Tenderly deploy init start...')

  try {
    const txBalance = await provider.send('tenderly_setBalance', [
      [process.env.TENDERLY_FORK_ACCOUNT],
      '0xDE0B6B3A7640000',
    ])
    console.log('sent txBalance', txBalance)
    const txErc20 = await provider.send('tenderly_setErc20Balance', [
      '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      process.env.TENDERLY_FORK_ACCOUNT,
      '0xDE0B6B3A7640000',
    ])
    // console.log('sent txErc20', txErc20)
    // const txSnapshot = await provider.send('evm_snapshot', [])
    // console.log('sent txSnapshot', txSnapshot)

    await Promise.all([
      provider.waitForTransaction(txBalance),
      provider.waitForTransaction(txErc20),
      // provider.waitForTransaction(txSnapshot),
    ])
    console.log('> Tenderly deploy init done!')
  } catch (error) {
    console.error('> Tenderly deploy init error: ', error)
  }
}
