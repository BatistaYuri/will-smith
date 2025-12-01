const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getApiStats } = require('../../services/lol/lolApi');
const { getQueueInfo } = require('../../services/audio/audioService');
const logger = require('../../utils/logger');
const { COLORS } = require('../../config/constants');

// Momento em que o bot iniciou
const startTime = Date.now();

/**
 * Formata tempo de uptime
 */
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Formata bytes para tamanho legível
 */
const formatMemory = (bytes) => {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostra o status do bot'),

  async execute(interaction) {
    const uptime = Date.now() - startTime;
    const memUsage = process.memoryUsage();
    const apiStats = getApiStats();
    const audioInfo = getQueueInfo(interaction.guild?.id);
    const logFiles = logger.getLogFiles();

    const embed = new EmbedBuilder()
      .setTitle('📊 Status do Bot')
      .setColor(COLORS.INFO)
      .addFields(
        {
          name: '⏱️ Uptime',
          value: formatUptime(uptime),
          inline: true,
        },
        {
          name: '💾 Memória',
          value: formatMemory(memUsage.heapUsed),
          inline: true,
        },
        {
          name: '📡 Ping',
          value: `${interaction.client.ws.ping}ms`,
          inline: true,
        },
        {
          name: '🎮 API Riot - Rate Limiter',
          value: `${apiStats.rateLimiter.requestsThisSecond}/${apiStats.rateLimiter.maxPerSecond} req/s\n${apiStats.rateLimiter.requestsThis2Min}/${apiStats.rateLimiter.maxPer2Min} req/2min`,
          inline: true,
        },
        {
          name: '📦 Cache',
          value: `Partidas: ${apiStats.matchCache.size}\nJogadores: ${apiStats.playerCache.size}`,
          inline: true,
        },
        {
          name: '🔊 Áudio',
          value: audioInfo.connected 
            ? `Conectado\nFila: ${audioInfo.queueLength} áudios\nTocando: ${audioInfo.isPlaying ? 'Sim' : 'Não'}`
            : 'Desconectado',
          inline: true,
        },
        {
          name: '📝 Logs',
          value: `${logFiles.length} arquivo(s)`,
          inline: true,
        },
        {
          name: '🖥️ Node.js',
          value: process.version,
          inline: true,
        },
        {
          name: '🤖 Servidores',
          value: `${interaction.client.guilds.cache.size}`,
          inline: true,
        }
      )
      .setFooter({ text: 'Will Smith Bot' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

