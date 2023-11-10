oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @oasisdex/summer-cli
$ summer-cli COMMAND
running command...
$ summer-cli (--version)
@oasisdex/summer-cli/0.0.0 darwin-arm64 node-v18.16.0
$ summer-cli --help [COMMAND]
USAGE
  $ summer-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`summer-cli conf [KEY] [VALUE]`](#summer-cli-conf-key-value)
* [`summer-cli get-token [WALLET] TOKEN`](#summer-cli-get-token-wallet-token)
* [`summer-cli help [COMMANDS]`](#summer-cli-help-commands)
* [`summer-cli setup`](#summer-cli-setup)

## `summer-cli conf [KEY] [VALUE]`

manage configuration

```
USAGE
  $ summer-cli conf [KEY] [VALUE] [-h] [-k <value>] [-v <value>] [-d] [-p <value>] [-n <value>] [-d
    <value>]

ARGUMENTS
  KEY    key of the config
  VALUE  value of the config

FLAGS
  -d, --cwd=<value>      config file location
  -d, --delete           delete?
  -h, --help             show CLI help
  -k, --key=<value>      key of the config
  -n, --name=<value>     config file name
  -p, --project=<value>  project name
  -v, --value=<value>    value of the config

DESCRIPTION
  manage configuration
```

_See code: [conf-cli](https://github.com/natzcam/conf-cli/blob/v0.1.9/src/commands/conf.ts)_

## `summer-cli get-token [WALLET] TOKEN`

Get ERC20 token to given addreess

```
USAGE
  $ summer-cli get-token [WALLET] TOKEN

ARGUMENTS
  WALLET  Wallet address to get token
  TOKEN   (WETH|DAI|USDC|WBTC|STETH|AAVE|UNI|LINK) Token to get

DESCRIPTION
  Get ERC20 token to given addreess

EXAMPLES
  $ summer-cli get-token
```

_See code: [src/commands/get-token.ts](https://github.com/OasisDEX/oasis-earn-sc/blob/v0.0.0/src/commands/get-token.ts)_

## `summer-cli help [COMMANDS]`

Display help for summer-cli.

```
USAGE
  $ summer-cli help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for summer-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.20/src/commands/help.ts)_

## `summer-cli setup`

Initial setup of the cli

```
USAGE
  $ summer-cli setup

DESCRIPTION
  Initial setup of the cli

EXAMPLES
  $ summer-cli setup
```

_See code: [src/commands/setup.ts](https://github.com/OasisDEX/oasis-earn-sc/blob/v0.0.0/src/commands/setup.ts)_
<!-- commandsstop -->
