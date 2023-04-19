- Import and expose addresses directly from the deployment configs file in dma-contracts/scripts/deployment20
- Add Lerna Changelog https://github.com/lerna/lerna-changelog
- Add Husky to perform checks before commit
- Update the many skipped tests
- Setup Unit & E2E tests workflows
- Add instructions for regenerating domain unit tests scenarios
- Update name of index() function
- Ensure docs are in sync with GitBook (determine if still relevant)
- Extract HH config into separate package if poss
- Perhaps move Deploy scripts into separate package
- Perhaps move typechain into separate package to solve circular dependency issue
- Unify Node reset methods on DeploymentSystem class
- Remove Ramda if possible
- Make import absolute. Add `ESLint` rule for it. Background: Some scripts & tasks have relative imports.
- Use Lerna param `scope` to run tests only affected by changes. 
- Use Lerna param `scope` to publish libraries which are only affected by changes.
- Refactor scripts & tasks to use `ethers` from hardhat. We can get a contract with typings without specifying `ABI`
- One `ESLint` configuration for all packages
- One `Prettier` configuration for all packages
- Some libraries use `tsconfig` to resolve imports. Investigate the output package if that is using package as a dependency and doesn't build code again. 
- Try to have only one `hardhat.config`
- Try to use one `tsconfig` for all packages.
- Let's run lint only on Pull Request only. We don't need to check it on dev
  ```yaml
    on:
    pull_request:
    types: [opened, edited, synchronize, reopened]
  ```