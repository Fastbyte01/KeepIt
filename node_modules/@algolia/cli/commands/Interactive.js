const inquirer = require('inquirer');

class Interactive {
  parseCommandNames(commandList, ownName) {
    const names = commandList.map(command => command._name);
    // Remove current command name and default command
    const commandNames = names.filter(name => name !== ownName && name !== '*');
    return commandNames;
  }

  getCommandQuestion(commandNames) {
    return {
      type: 'list',
      name: 'commandChoice',
      message: 'Select the command to run',
      choices: commandNames,
    };
  }

  getArgumentQuestions(validArguments) {
    return validArguments.map(argument => ({
      type: argument.description.includes('key') ? 'password' : 'input',
      name: argument.long.substring(2),
      message: `${argument.long} | ${argument.description}`,
    }));
  }

  async start(program) {
    try {
      const commands = require('../commands.js');
      const ownName = program._name;
      const commandList = program.parent.commands;
      // Get list of valid commands
      const commandNames = this.parseCommandNames(commandList, ownName);
      const commandQuestion = this.getCommandQuestion(commandNames);
      // Prompt user to select a command
      const commandResponse = await inquirer.prompt(commandQuestion);
      // Prepare subsequent questions
      const selectedCommand = commandList.find(
        command => command._name === commandResponse.commandChoice
      );
      const validArguments = selectedCommand.options;
      const argumentQuestions = this.getArgumentQuestions(validArguments);
      // Prompt user to input command arguments
      const argumentsResponse = await inquirer.prompt(argumentQuestions);
      // Pass arguments to program
      const argumentsList = Object.keys(argumentsResponse);
      argumentsList.forEach(arg => {
        if (argumentsResponse[arg] !== '')
          program[arg] = argumentsResponse[arg]; // eslint-disable-line no-param-reassign
      });
      // Execute selected command
      commands[selectedCommand._name].start(program);
    } catch (e) {
      throw e;
    }
  }
}

module.exports = new Interactive();
