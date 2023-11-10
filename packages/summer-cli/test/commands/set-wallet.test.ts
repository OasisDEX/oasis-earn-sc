import {expect, test} from '@oclif/test'

describe('set-wallet', () => {
  test
  .stdout()
  .command(['set-wallet'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['set-wallet', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
