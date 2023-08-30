# Summer Mono

## Environment variables

Copy and populate an `.env` file according to the .env.template file.

## Setup

1. Install dependencies

```shell
yarn
```

2. Clean packages

```shell
yarn clean
```

3. Build packages

```shell
yarn build
```

4. Compile contracts (optional)
Contracts are automatically compiled when running `yarn build` but can also be compiled separately

```shell
yarn compile
```

## Local development

Running a local node & deploying the system to a locally running node

1. Running a local node

```shell
yarn dev
```

2. Deploying the system to your local node

```shell
yarn deploy:dev
```

## Running tests

1. Run all tests in the monorepo

```shell
yarn test
```

2. Run all unit tests in the monorepo

```shell
yarn test:unit
```

3. Run all e2e tests in the monorepo

```shell
yarn test:e2e
```

4. Run a specific test in the specific package (example)
_Command should be run from a respective package folder_

```shell
yarn clean & yarn hardhat test <path-to-test>
```

## Naming conventions

- TS files and all folders are named using kebab-case
- -Solidity files (interfaces, contracts etc) are named using Pascal case

## Hardhat tasks

1. Create multiply positions on a network of your choosing

```shell
cd packages/dma-contracts && yarn hardhat createMultiplyPositions --serviceregistry <service-registry-address> --accountfactory <account-factory-address> --network <insert-network>
```

**Note:** There's an issue with circular dependencies between packages. You'll need to ensure that tasks which causes circular dependencies are 
not included in the hardhat.config.ts file in @oasisdex/dma-contracts. For more info see the [readme](./packages/dma-contracts/README.md) in the packages/dma-contracts folder

## Deploy contracts

Please see the [readme](./packages/dma-contracts/README.md) in the packages/dma-contracts folder for more information

