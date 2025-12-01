const { Events } = require('discord.js');
const { createMatchDetailsEmbed, createMatchResultEmbed } = require('../utils/embedBuilder');
const logger = require('../utils/logger');

// Cache temporário para dados de partidas (para os botões)
const matchDataCache = new Map();

/**
 * Salva dados de partida para uso nos botões
 */
const saveMatchData = (messageId, ranking) => {
  matchDataCache.set(messageId, {
    ranking,
    timestamp: Date.now(),
  });

  // Limpa após 30 minutos
  setTimeout(() => {
    matchDataCache.delete(messageId);
  }, 30 * 60 * 1000);
};

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction) {
    // Só processa botões
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    try {
      switch (customId) {
        case 'match_details': {
          const data = matchDataCache.get(interaction.message.id);
          if (!data) {
            return interaction.reply({
              content: '❌ Dados da partida expiraram. Use o comando novamente.',
              ephemeral: true,
            });
          }

          const { embed, components } = createMatchDetailsEmbed(data.ranking);
          await interaction.reply({ embeds: [embed], components, ephemeral: true });
          break;
        }

        case 'match_back': {
          await interaction.update({ content: 'Voltando...', embeds: [], components: [] });
          break;
        }

        case 'match_refresh': {
          await interaction.reply({
            content: '🔄 Para atualizar, use o comando `/lol` novamente.',
            ephemeral: true,
          });
          break;
        }

        default:
          logger.debug(`Botão não reconhecido: ${customId}`);
      }
    } catch (error) {
      logger.error('Erro ao processar interação de botão', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar o botão.',
          ephemeral: true,
        });
      }
    }
  },

  // Exporta função para salvar dados
  saveMatchData,
};

