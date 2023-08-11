import hre from 'hardhat'
import inquirer from 'inquirer'

async function main() {
  await hre.run('compile')

  const questions = [
    {
      type: 'input',
      name: 'taskName',
      message: "What's task called that you'd like you want to run?",
    },
    {
      type: 'input',
      name: 'whatParams',
      message: 'What params would you like to pass to the task?',
    },
    // TODO: Automatically discover tasks based on supplied task name
    {
      type: 'input',
      name: 'taskFileName',
      message:
        "What's task file name (or directory name) you want to run? Just the filename, not the path.",
    },
  ]

  const answers = await inquirer.prompt(questions)

  try {
    await import(`../tasks/${answers.taskFileName}`)
  } catch (e) {
    await import(`../tasks/${answers.taskFileName}/index.ts`)
  }

  const command =
    answers.whatParams === '' ? `${answers.taskName}` : `${answers.taskName} ${answers.whatParams}`
  await hre.run(command)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
