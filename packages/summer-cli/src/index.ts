import { getCommandName, parseArguments } from './cli'
import { Command } from './cli/command'
import { getCommandsMap } from './cli/get-commands-map'
import * as commands from './commands'
import { getEnvitoment } from './utils/get-enviroment'

async function runCommand(command: Command, args: Record<string, string>) {
    const enviroment = await getEnvitoment()

    try {
        console.log(args)
        const parsedArgs = await command.args.validate(args)
        command.run(parsedArgs, enviroment)

    } catch (error) {
        console.log('Invalid arguments', error)
    }

}

async function main (args: string[]) {
    const commandName = getCommandName(args)
    const commandsMap = getCommandsMap(commands)
    const avaiableCommands = Object.keys(commandsMap)

    if (commandName !== undefined && avaiableCommands.includes(commandName)) {
        runCommand(commandsMap[commandName], parseArguments(args))
    } else {
        console.log(`Command not found: ${commandName}`)
    }
    
}

main(process.argv)