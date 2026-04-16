const path = require('path');
const fs = require('fs');

/**
 * Configurações centralizadas do bot
 * Carrega o arquivo .env correto baseado no ambiente
 * No Discloud, as variáveis são passadas diretamente pelo sistema
 */

const isDev = process.env.NODE_ENV === 'development';
const envFiles = isDev
  ? ['.env.development', 'env.development']
  : ['.env.production', 'env.production'];
const envFile = envFiles.find((file) =>
  fs.existsSync(path.resolve(process.cwd(), file))
);
const envPath = envFile ? path.resolve(process.cwd(), envFile) : null;

// Carrega o arquivo .env se existir (desenvolvimento local)
// No Discloud, as variáveis já estão no process.env
if (envPath && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`📄 Usando: ${envFile}`);
} else {
  // Tenta carregar .env genérico ou usa variáveis do sistema
  require('dotenv').config();
  console.log('📄 Usando variáveis de ambiente do sistema');
}

// Log do ambiente atual
console.log(`🔧 Ambiente: ${isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);

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
