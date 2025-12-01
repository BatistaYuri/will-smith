const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Carrega todos os eventos do bot
 * @param {Client} client - Cliente do Discord
 */
const loadEvents = (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  let eventCount = 0;

  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);

    try {
      const event = require(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      logger.debug(`Evento carregado: ${event.name}`);
      eventCount++;
    } catch (error) {
      logger.error(`Erro ao carregar evento: ${file}`, error);
    }
  }

  logger.success(`${eventCount} eventos carregados`);
};

module.exports = { loadEvents };

