/**
 * Script para deploy dos comandos slash no Discord
 * Execute: node src/deploy-commands.js
 */

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, clientId, guildId } = require('./config');
const logger = require('./utils/logger');

/**
 * Carrega todos os comandos das pastas
 * @returns {Array} Lista de comandos em formato JSON
 */
const loadAllCommands = () => {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const stat = fs.statSync(folderPath);

    if (stat.isDirectory()) {
      const commandFiles = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const commandModule = require(filePath);

        // Se for array de comandos
        if (Array.isArray(commandModule)) {
          for (const command of commandModule) {
            if ('data' in command) {
              commands.push(command.data.toJSON());
              logger.debug(`Comando carregado: ${command.data.name}`);
            }
          }
        } else if ('data' in commandModule) {
          commands.push(commandModule.data.toJSON());
          logger.debug(`Comando carregado: ${commandModule.data.name}`);
        }
      }
    } else if (folder.endsWith('.js')) {
      const commandModule = require(folderPath);

      if (Array.isArray(commandModule)) {
        for (const command of commandModule) {
          if ('data' in command) {
            commands.push(command.data.toJSON());
            logger.debug(`Comando carregado: ${command.data.name}`);
          }
        }
      } else if ('data' in commandModule) {
        commands.push(commandModule.data.toJSON());
        logger.debug(`Comando carregado: ${commandModule.data.name}`);
      }
    }
  }

  return commands;
};

/**
 * Faz o deploy dos comandos
 */
const deployCommands = async () => {
  logger.info('Iniciando deploy de comandos...');

  const commands = loadAllCommands();
  logger.info(`${commands.length} comandos encontrados`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    logger.info('Registrando comandos no Discord...');

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    logger.success(`${data.length} comandos registrados com sucesso!`);
  } catch (error) {
    logger.error('Erro ao registrar comandos', error);
    process.exit(1);
  }
};

deployCommands();
