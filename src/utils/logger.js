/**
 * Sistema de logging centralizado com suporte a arquivo
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Configurações
const currentLevel = LOG_LEVELS.DEBUG;
const LOG_TO_FILE = true;
const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

// Garante que a pasta de logs existe
if (LOG_TO_FILE && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Retorna o nome do arquivo de log atual (baseado na data)
 */
const getLogFileName = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `bot-${date}.log`);
};

/**
 * Formata a data atual para logs
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Formata a mensagem de log
 */
const formatMessage = (level, message, data) => {
  const timestamp = getTimestamp();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
};

/**
 * Escreve no arquivo de log
 */
const writeToFile = (formattedMessage) => {
  if (!LOG_TO_FILE) return;

  try {
    const logFile = getLogFileName();
    
    // Verifica tamanho do arquivo e rotaciona se necessário
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = Date.now();
        fs.renameSync(logFile, logFile.replace('.log', `-${timestamp}.log`));
      }
    }

    fs.appendFileSync(logFile, formattedMessage + '\n');
  } catch (error) {
    console.error('Erro ao escrever log em arquivo:', error.message);
  }
};

const logger = {
  debug: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      const formatted = formatMessage('DEBUG', message, data);
      console.log(formatted);
      writeToFile(formatted);
    }
  },

  info: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      const formatted = formatMessage('INFO', message, data);
      console.log(formatted);
      writeToFile(formatted);
    }
  },

  warn: (message, data = null) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      const formatted = formatMessage('WARN', message, data);
      console.warn(formatted);
      writeToFile(formatted);
    }
  },

  error: (message, error = null) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      const formatted = formatMessage('ERROR', message);
      console.error(formatted);
      writeToFile(formatted);
      
      if (error) {
        const errorDetails = error.stack || error.message || String(error);
        console.error(errorDetails);
        writeToFile(`[ERROR DETAILS] ${errorDetails}`);
      }
    }
  },

  success: (message, data = null) => {
    const formatted = formatMessage('✓ SUCCESS', message, data);
    console.log(formatted);
    writeToFile(formatted);
  },

  /**
   * Retorna o caminho do diretório de logs
   */
  getLogDir: () => LOG_DIR,

  /**
   * Lista os arquivos de log existentes
   */
  getLogFiles: () => {
    if (!fs.existsSync(LOG_DIR)) return [];
    return fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log'));
  },
};

module.exports = logger;
