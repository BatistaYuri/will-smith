const path = require('path');

/**
 * Configurações centralizadas do bot
 * Carrega o arquivo .env correto baseado no ambiente
 */

const isDev = process.env.NODE_ENV === 'development';
const envFile = isDev ? '.env.development' : '.env.production';

// Carrega o arquivo .env correto
require('dotenv').config({
  path: path.resolve(process.cwd(), envFile),
});

// Log do ambiente atual
console.log(`🔧 Ambiente: ${isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
console.log(`📄 Usando: ${envFile}`);

module.exports = {
  // Ambiente
  isDev,
  env: isDev ? 'development' : 'production',

  // Discord
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // Riot Games API
  riotApiKey: process.env.LOL_KEY,

  // Prefixos (legado)
  prefix: '-w',
  prefixSong: '-toca',
  prefixStopSong: '-sai',

  // Canais
  channels: {
    voice: 'Amantes do Alisson',
    text: 'lol',
  },

  // Cron
  cron: {
    lolCheck: '*/10 * * * * *', // A cada 10 segundos
    timezone: 'America/Sao_Paulo',
  },
};
