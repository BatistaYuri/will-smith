const { SlashCommandBuilder } = require('discord.js');
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
 * Comando FPS - Toca áudios aleatórios em intervalos aleatórios
 */

// Estado do FPS por guild
const fpsState = new Map();

/**
 * Retorna um tempo aleatório entre 1 e 10 minutos (em ms)
 */
const getRandomTime = () => {
  return Math.floor(Math.random() * 10 + 1) * 60000;
};

/**
 * Retorna um número aleatório de áudio (0-17)
 */
const getRandomAudioIndex = () => {
  return Math.floor(Math.random() * 18);
};

/**
 * Loop de reprodução de áudios
 */
const playLoop = async (guildId) => {
  const state = fpsState.get(guildId);
  
  if (!state || state.stopped) {
    return;
  }

  try {
    const audioIndex = getRandomAudioIndex();
    const audioPath = path.join(
      process.cwd(),
      MEDIA_PATHS.AUDIOS_FPS,
      `${audioIndex}.mp3`
    );

    const resource = createAudioResource(audioPath);
    state.player.play(resource);

    logger.debug(`FPS: Tocando áudio ${audioIndex}`);
  } catch (error) {
    logger.error('FPS: Erro ao tocar áudio', error);
  }

  // Agenda o próximo áudio
  const nextTime = getRandomTime();
  logger.debug(`FPS: Próximo áudio em ${nextTime / 60000} minutos`);
  
  state.timeout = setTimeout(() => playLoop(guildId), nextTime);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fps')
    .setDescription('Ativa o modo FPS - áudios aleatórios em intervalos aleatórios'),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Você precisa estar em um canal de voz!',
        ephemeral: true,
      });
    }

    const guildId = interaction.guild.id;

    // Verifica se já está ativo
    if (fpsState.has(guildId) && !fpsState.get(guildId).stopped) {
      return interaction.reply({
        content: '⚠️ O modo FPS já está ativo! Use `/stop` para parar.',
        ephemeral: true,
      });
    }

    try {
      // Cria a conexão
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 5000);

      // Cria o player
      const player = createAudioPlayer();
      connection.subscribe(player);

      // Configura o estado
      fpsState.set(guildId, {
        connection,
        player,
        stopped: false,
        timeout: null,
      });

      // Inicia o loop
      playLoop(guildId);

      logger.info(`FPS: Iniciado na guild ${guildId}`);
      return interaction.reply({
        content: '🎲 Modo FPS ativado! Áudios aleatórios serão tocados em intervalos de 1-10 minutos.',
      });
    } catch (error) {
      logger.error('FPS: Erro ao iniciar', error);
      return interaction.reply({
        content: '❌ Erro ao ativar o modo FPS!',
        ephemeral: true,
      });
    }
  },
};

// Exporta função para parar o FPS (usado pelo comando stop)
module.exports.stopFps = (guildId) => {
  const state = fpsState.get(guildId);
  
  if (state) {
    state.stopped = true;
    
    if (state.timeout) {
      clearTimeout(state.timeout);
    }
    
    if (state.player) {
      state.player.stop();
    }
    
    if (state.connection) {
      state.connection.destroy();
    }
    
    fpsState.delete(guildId);
    logger.info(`FPS: Parado na guild ${guildId}`);
  }
};

