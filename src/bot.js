/**
 * Will Smith Bot
 * Bot do Discord para monitoramento de partidas de LoL e reprodução de áudios
 */

require('dotenv').config();

const http = require('http');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { token, isDev, env } = require('./config');
const logger = require('./utils/logger');

/**
 * Servidor HTTP para health check (necessário para Render Web Service gratuito)
 */
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
	if (req.url === '/health' || req.url === '/') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ 
			status: 'ok', 
			bot: 'Will Smith Bot',
			uptime: process.uptime(),
			memory: process.memoryUsage().rss / 1024 / 1024
		}));
	} else {
		res.writeHead(404);
		res.end('Not Found');
	}
});

server.listen(PORT, () => {
	logger.info(`Servidor HTTP rodando na porta ${PORT}`);
});

/**
 * Configuração do cliente Discord
 */
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
});

// Coleção de comandos
client.commands = new Collection();

/**
 * Inicializa o bot
 */
const initialize = async () => {
	console.log('');
	console.log('╔════════════════════════════════════════╗');
	console.log('║          🤖 WILL SMITH BOT             ║');
	console.log(`║     Ambiente: ${isDev ? '🔧 DESENVOLVIMENTO' : '🚀 PRODUÇÃO'}       ║`);
	console.log('╚════════════════════════════════════════╝');
	console.log('');

	logger.info(`Iniciando em modo ${env}...`);

	// Carrega comandos e eventos
	loadCommands(client);
	loadEvents(client);

	// Conecta ao Discord
	try {
		await client.login(token);
	} catch (error) {
		logger.error('Erro ao conectar ao Discord', error);
		logger.error('Verifique se o TOKEN está correto no .env');
		process.exit(1);
	}
};

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
	logger.error('Unhandled Rejection', error);
});

process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception', error);
	process.exit(1);
});

// Inicia o bot
initialize();
