# Environment variables

Copy and populate an `.env` file according to the .env.template file.

# Setup

1. Install dependencies

```shell
yarn
```

2. Build packages

```shell
yarn build
```

3. Compile contracts

```shell
yarn compile
```

# Local development

Running a local node & deploying the system to a locally running node

1. Running a local node

```shell
yarn dev
```

2. Deploying the system to your local node

```shell
yarn deploy:dev
```

# Running tests

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

4. Run a specific test in the repo (example)

```shell
yarn clean & yarn hardhat test <path-to-test>
```

# Naming conventions

- TS files and all folders are named using kebab-case
- -Solidity files (interfaces, contracts etc) are named using Pascal case

# Hardhat tasks

1. Create multiply positions on a network of your choosing

```shell
cd packages/dma-contracts && yarn hardhat createMultiplyPositions --serviceregistry <service-registry-address> --accountfactory <account-factory-address> --network <insert-network>
```
