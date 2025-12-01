const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Carrega todos os comandos do bot
 * @param {Client} client - Cliente do Discord
 */
const loadCommands = (client) => {
  const commandsPath = path.join(__dirname, '..', 'commands');
  let commandCount = 0;

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const stat = fs.statSync(folderPath);

    if (stat.isDirectory()) {
      const commandFiles = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        commandCount += loadCommand(client, path.join(folderPath, file));
      }
    } else if (folder.endsWith('.js')) {
      commandCount += loadCommand(client, folderPath);
    }
  }

  logger.success(`${commandCount} comandos carregados`);
};

/**
 * Carrega um comando ou array de comandos
 * @param {Client} client - Cliente do Discord
 * @param {string} filePath - Caminho do arquivo
 * @returns {number} Quantidade de comandos carregados
 */
const loadCommand = (client, filePath) => {
  try {
    const commandModule = require(filePath);

    // Se for um array de comandos
    if (Array.isArray(commandModule)) {
      let count = 0;
      for (const command of commandModule) {
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          logger.debug(`Comando carregado: ${command.data.name}`);
          count++;
        }
      }
      return count;
    }

    // Se for um comando único
    if ('data' in commandModule && 'execute' in commandModule) {
      client.commands.set(commandModule.data.name, commandModule);
      logger.debug(`Comando carregado: ${commandModule.data.name}`);
      return 1;
    }

    logger.warn(`Comando inválido: ${filePath}`);
    return 0;
  } catch (error) {
    logger.error(`Erro ao carregar comando: ${filePath}`, error);
    return 0;
  }
};

module.exports = { loadCommands };
