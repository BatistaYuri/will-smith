const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { playAudio, stopAudio, skipAudio, clearQueue, getQueueInfo } = require('../../services/audio/audioService');
const { createErrorEmbed, createSuccessEmbed, createAudioEmbed } = require('../../utils/embedBuilder');
const { MEDIA_PATHS } = require('../../config/constants');
const path = require('path');
const fs = require('fs');

/**
 * Configuração de todos os comandos de áudio
 */
const audioCommandsConfig = [
  // Comandos com GIF
  { name: 'banido', description: 'Áudio e gif do banido', hasGif: true },
  { name: 'perdemo', description: 'Áudio e gif do perdemo', hasGif: true },
  { name: 'empatamo', description: 'Áudio e gif do empatamo', hasGif: true },
  { name: 'ganhamo', description: 'Áudio e gif do ganhamo', hasGif: true },
  { name: 'bota', description: 'Áudio e gif do bota', hasGif: true },

  // Comandos com imagem
  { name: 'legal', description: 'Áudio e imagem do legal', hasImage: true },
  { name: 'machista', description: 'Finn machista', hasImage: true },
  { name: 'triste', description: 'Eu fico mt triste com uma notícia dessas :(', hasImage: true },
  { name: 'confia', description: 'Só confia', hasImage: true },
  { name: 'etsirt', description: '(: sassed aiciton amu moc etsirt tm ocif ue', hasImage: true },

  // Comandos só áudio
  { name: 'alek', description: 'Alek talking in english' },
  { name: 'ohuhalek', description: 'Alek destruindo na pista de dança' },
  { name: 'cavalo', description: 'Cavalo' },
  { name: 'massachusetts', description: 'Massachusetts' },
  { name: 'oi', description: 'Oi linda, ai kawaii' },
  { name: 'nicolas', description: 'Turugudum cha cha turugu cha turuudum cha cha' },
  { name: 'glub', description: 'Glub glub' },
  { name: 'an', description: 'Ãn' },
  { name: 'yamete', description: 'Yamete Kudasai' },
  { name: 'fdp', description: 'Iiui' },
  { name: 'derrota', description: 'Derrota' },
  { name: 'eele', description: 'Caralho Will Smith?' },
  { name: 'machista2', description: 'Vai dirigir a cozinha' },
  { name: 'skype', description: 'Toque da chamada do Skype' },
  { name: 'lobomau', description: 'Nossa lobo mau' },
];

/**
 * Cria um comando de áudio
 */
const createAudioCommand = (config) => {
  const { name, description, hasGif = false, hasImage = false } = config;

  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description),

    async execute(interaction) {
      const voiceChannel = interaction.member?.voice?.channel;

      if (!voiceChannel) {
        const embed = createErrorEmbed(
          'Você precisa estar em um canal de voz!',
          'Entre em um canal de voz e tente novamente.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const result = await playAudio(voiceChannel, name);

      if (!result.success) {
        const embed = createErrorEmbed(
          'Erro ao tocar o áudio!',
          result.error || 'Verifique se o arquivo de áudio existe.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Monta a resposta
      const replyOptions = {};
      
      // Se está na fila
      if (result.queueLength > 0 && result.isPlaying) {
        replyOptions.content = `🔊 **${name}** adicionado à fila! (posição: ${result.queueLength + 1})`;
      } else {
        replyOptions.content = `🔊 Tocando **${name}**!`;
      }

      // Adiciona mídia se existir
      if (hasGif) {
        const gifPath = path.join(process.cwd(), MEDIA_PATHS.GIFS, `${name}.gif`);
        if (fs.existsSync(gifPath)) {
          replyOptions.files = [new AttachmentBuilder(gifPath, { name: `${name}.gif` })];
        }
      } else if (hasImage) {
        const imagePath = path.join(process.cwd(), MEDIA_PATHS.IMAGES, `${name}.jpg`);
        if (fs.existsSync(imagePath)) {
          replyOptions.files = [new AttachmentBuilder(imagePath, { name: `${name}.jpg` })];
        }
      }

      return interaction.reply(replyOptions);
    },
  };
};

/**
 * Comando stop
 */
const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Para o áudio e desconecta do canal'),

  async execute(interaction) {
    const guildId = interaction.guild?.id;
    if (!guildId) {
      const embed = createErrorEmbed('Não foi possível identificar o servidor.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    stopAudio(guildId);
    const embed = createSuccessEmbed('Parado!', 'Áudio parado e desconectado do canal.');
    return interaction.reply({ embeds: [embed] });
  },
};

/**
 * Comando skip - pula o áudio atual
 */
const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Pula o áudio atual'),

  async execute(interaction) {
    const guildId = interaction.guild?.id;
    if (!guildId) {
      const embed = createErrorEmbed('Não foi possível identificar o servidor.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const skipped = skipAudio(guildId);
    
    if (skipped) {
      const queueInfo = getQueueInfo(guildId);
      const embed = createSuccessEmbed(
        'Pulado!',
        queueInfo.queueLength > 0 
          ? `Tocando próximo áudio. (${queueInfo.queueLength} na fila)`
          : 'Nenhum áudio na fila.'
      );
      return interaction.reply({ embeds: [embed] });
    } else {
      const embed = createErrorEmbed(
        'Não há nada tocando!',
        'Use um comando de áudio primeiro.'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

/**
 * Comando queue - mostra a fila de áudios
 */
const queueCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Mostra a fila de áudios'),

  async execute(interaction) {
    const guildId = interaction.guild?.id;
    if (!guildId) {
      const embed = createErrorEmbed('Não foi possível identificar o servidor.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const queueInfo = getQueueInfo(guildId);
    
    if (!queueInfo.connected) {
      const embed = createErrorEmbed(
        'Bot não está conectado!',
        'Use um comando de áudio para conectar.'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const embed = createAudioEmbed('Fila de Áudios', queueInfo);
    embed.addFields(
      { name: '🔊 Status', value: queueInfo.isPlaying ? 'Tocando' : 'Pausado', inline: true },
      { name: '📋 Na fila', value: `${queueInfo.queueLength} áudio(s)`, inline: true }
    );
    
    if (queueInfo.queueLength > 0) {
      embed.addFields({
        name: '📝 Próximos',
        value: queueInfo.queue.slice(0, 5).map((a, i) => `${i + 1}. ${a}`).join('\n') || 'Vazia',
        inline: false,
      });
    }
    
    return interaction.reply({ embeds: [embed] });
  },
};

/**
 * Comando clear - limpa a fila
 */
const clearCommand = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa a fila de áudios'),

  async execute(interaction) {
    const guildId = interaction.guild?.id;
    if (!guildId) {
      const embed = createErrorEmbed('Não foi possível identificar o servidor.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const cleared = clearQueue(guildId);
    
    if (cleared > 0) {
      const embed = createSuccessEmbed('Fila limpa!', `${cleared} áudio(s) removido(s) da fila.`);
      return interaction.reply({ embeds: [embed] });
    } else {
      const embed = createErrorEmbed('A fila já está vazia!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Gera todos os comandos
const audioCommands = audioCommandsConfig.map(createAudioCommand);
audioCommands.push(stopCommand);
audioCommands.push(skipCommand);
audioCommands.push(queueCommand);
audioCommands.push(clearCommand);

module.exports = audioCommands;
