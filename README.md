# Runtime Environment Variables

One should create an `.env` file and add the following variables:

- **ETHERSCAN_API_KEY** - API key used to verify contracts deployed on a blockchain supported by Etherscan

- **MAINNET_URL** - URL to a node that will be used for sync

- **BLOCK_NUMBER** - Block number from which the chain will be forked

- **REPORT_GAS** - This will allow gas report when running tests

# Deploying system

Checkout the project locally.
In a shell prompt run the following command:

```shell
npx hardhat node
```

That will run a node for you a separate process that will be waiting to accept new calls.

In a separate shell prompt run the following command:

```shell
npx hardhat deploy
```

That will deploy all necessary contracts to use for AAVE.
For now this task supports only deploying core & AAVE related contracts.

In order to print the addresses out, one should provide the `--debug` flag

```shell
npx hardhat deploy --debug
```

That will output the deployed contract name and the corresponding address

# Running a node & deploying the system to a locally running node

1. Running a node is as simple as writing in a shell prompt:

```shell
npx hardhat node --max-memory 8192 --fork <ALCHEMY_API_URL>
```

2. Deploying the system against the node you've spun up

`yarn deploy:fallback` 

or 

`yarn deploy:1inch` // if you want to use 1inch as exchange


# Running tests

Running the project tests could be done either by calling

```shell
npx hardhat test
```

in the shell prompt or:

```shell
yarn run test
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's
supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the
details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key
of the account which will send the deployment transaction. With a valid .env file in place, first
deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this
command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Debugging with Tenderly

Tenderly export only works with Hardhat v2.8.0. More recently versions will result in errors such as the one below

```shell
Errors encountered in param 1: Storage slot argument must have a length of 66 ("0x" + 32 bytes), but '0x0' has a length of 3
```

However, tests will fail with Hardhat v2.8.0 because of how HardHat's JsonRpcProvider implementation.
See https://github.com/NomicFoundation/hardhat/issues/1700.
Errors such as the one below will appear when running tests with v2.8.0. Use Hardhat v2.9.5 when running tests.

```shell
InvalidArgumentsError: Errors encountered in param 1: Invalid value "0x0000000000000000000000000000000000000000000000000000000000000003" supplied to : QUANTITY
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the
environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see
[the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
