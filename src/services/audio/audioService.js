const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const path = require('path');
const { MEDIA_PATHS } = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Serviço de áudio para o bot
 * Com suporte a fila de áudios e auto-desconexão
 */

// Configurações
const AUTO_DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutos de inatividade

// Estado por guild
const guildState = new Map();

/**
 * Obtém ou cria o estado de uma guild
 */
const getGuildState = (guildId) => {
  if (!guildState.has(guildId)) {
    guildState.set(guildId, {
      connection: null,
      player: null,
      queue: [],
      isPlaying: false,
      disconnectTimeout: null,
      lastActivity: Date.now(),
    });
  }
  return guildState.get(guildId);
};

/**
 * Reseta o timer de auto-desconexão
 */
const resetDisconnectTimer = (guildId) => {
  const state = getGuildState(guildId);
  
  if (state.disconnectTimeout) {
    clearTimeout(state.disconnectTimeout);
  }
  
  state.lastActivity = Date.now();
  
  state.disconnectTimeout = setTimeout(() => {
    if (!state.isPlaying && state.queue.length === 0) {
      logger.info(`Auto-desconectando da guild ${guildId} por inatividade`);
      stopAudio(guildId);
    }
  }, AUTO_DISCONNECT_TIMEOUT);
};

/**
 * Processa a fila de áudios
 */
const processQueue = async (guildId) => {
  const state = getGuildState(guildId);
  
  if (state.queue.length === 0) {
    state.isPlaying = false;
    // Sai do canal imediatamente quando terminar os áudios
    logger.debug('Fila vazia, desconectando do canal');
    stopAudio(guildId);
    return;
  }
  
  const nextAudio = state.queue.shift();
  state.isPlaying = true;
  
  try {
    const audioPath = path.join(
      process.cwd(),
      nextAudio.folder === 'audios' ? MEDIA_PATHS.AUDIOS : MEDIA_PATHS.AUDIOS_FPS,
      `${nextAudio.name}.mp3`
    );
    
    const resource = createAudioResource(audioPath);
    state.player.play(resource);
    
    logger.debug(`Tocando áudio: ${nextAudio.name} (fila: ${state.queue.length})`);
  } catch (error) {
    logger.error('Erro ao tocar áudio da fila', error);
    processQueue(guildId); // Tenta o próximo
  }
};

/**
 * Adiciona um áudio à fila e toca
 * @param {VoiceChannel} voiceChannel - Canal de voz
 * @param {string} audioName - Nome do arquivo de áudio (sem extensão)
 * @param {string} folder - Pasta do áudio (padrão: audios)
 * @returns {Promise<Object>} Informações sobre a fila
 */
const playAudio = async (voiceChannel, audioName, folder = 'audios') => {
  if (!voiceChannel) {
    logger.warn('Canal de voz não fornecido');
    return { success: false, error: 'Canal de voz não fornecido' };
  }

  try {
    const guildId = voiceChannel.guild.id;
    const state = getGuildState(guildId);
    
    // Cria ou reutiliza a conexão
    if (!state.connection || state.connection.state.status === VoiceConnectionStatus.Destroyed) {
      state.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });
    }

    // Aguarda a conexão estar pronta (30 segundos de timeout)
    await entersState(state.connection, VoiceConnectionStatus.Ready, 30_000);

    // Cria ou reutiliza o player
    if (!state.player) {
      state.player = createAudioPlayer();
      state.connection.subscribe(state.player);

      // Quando terminar um áudio, processa o próximo da fila
      state.player.on(AudioPlayerStatus.Idle, () => {
        processQueue(guildId);
      });

      state.player.on('error', (error) => {
        logger.error('Erro no player de áudio', error);
        processQueue(guildId); // Tenta o próximo
      });
    }

    // Adiciona à fila
    state.queue.push({ name: audioName, folder });
    
    // Se não está tocando, inicia
    if (!state.isPlaying) {
      processQueue(guildId);
    }
    
    // Reset timer de desconexão
    if (state.disconnectTimeout) {
      clearTimeout(state.disconnectTimeout);
      state.disconnectTimeout = null;
    }

    return {
      success: true,
      position: state.queue.length,
      isPlaying: state.isPlaying,
      queueLength: state.queue.length,
    };
  } catch (error) {
    logger.error('Erro ao tocar áudio', error);
    return { success: false, error: error.message };
  }
};

/**
 * Para o áudio e desconecta do canal
 * @param {string} guildId - ID da guild
 */
const stopAudio = (guildId) => {
  const state = guildState.get(guildId);
  
  if (!state) return;

  if (state.disconnectTimeout) {
    clearTimeout(state.disconnectTimeout);
  }

  if (state.player) {
    state.player.stop();
  }

  if (state.connection) {
    state.connection.destroy();
  }

  guildState.delete(guildId);
  logger.debug('Áudio parado e desconectado');
};

/**
 * Pula o áudio atual
 * @param {string} guildId - ID da guild
 */
const skipAudio = (guildId) => {
  const state = guildState.get(guildId);
  
  if (!state || !state.player) return false;
  
  state.player.stop(); // Isso vai disparar o evento Idle e processar o próximo
  return true;
};

/**
 * Limpa a fila de áudios
 * @param {string} guildId - ID da guild
 */
const clearQueue = (guildId) => {
  const state = guildState.get(guildId);
  
  if (!state) return 0;
  
  const cleared = state.queue.length;
  state.queue = [];
  return cleared;
};

/**
 * Retorna informações da fila
 * @param {string} guildId - ID da guild
 */
const getQueueInfo = (guildId) => {
  const state = guildState.get(guildId);
  
  if (!state) {
    return {
      connected: false,
      isPlaying: false,
      queueLength: 0,
      queue: [],
    };
  }
  
  return {
    connected: state.connection?.state.status === VoiceConnectionStatus.Ready,
    isPlaying: state.isPlaying,
    queueLength: state.queue.length,
    queue: state.queue.map(a => a.name),
    lastActivity: state.lastActivity,
  };
};

/**
 * Verifica se o bot está conectado a um canal de voz na guild
 * @param {string} guildId - ID da guild
 * @returns {boolean}
 */
const isConnected = (guildId) => {
  const state = guildState.get(guildId);
  return state?.connection?.state.status === VoiceConnectionStatus.Ready;
};

module.exports = {
  playAudio,
  stopAudio,
  skipAudio,
  clearQueue,
  getQueueInfo,
  isConnected,
};
