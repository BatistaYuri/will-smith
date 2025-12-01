const { Events } = require('discord.js');
const cron = require('node-cron');
const config = require('../config');
const { checkGameStatus } = require('../services/lol/lolGame');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.success(`Bot conectado como ${client.user.tag}`);

    // Busca canais
    const voiceChannel = client.channels.cache.find(
      (channel) => channel.name === config.channels.voice
    );

    const textChannel = client.channels.cache.find(
      (channel) => channel.name === config.channels.text
    );

    if (!voiceChannel || !textChannel) {
      logger.warn('Canais não encontrados', {
        voice: config.channels.voice,
        text: config.channels.text,
      });
      return;
    }

    // Inicia monitoramento de partidas
    await client.channels.fetch(voiceChannel.id);

    cron.schedule(
      config.cron.lolCheck,
      async () => {
        await checkGameStatus(client, voiceChannel, textChannel.id);
      },
      {
        scheduled: true,
        timezone: config.cron.timezone,
      }
    );

    logger.info('Monitoramento de partidas iniciado');
  },
};

