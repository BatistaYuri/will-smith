const { SlashCommandBuilder } = require('discord.js');
const { getLastMatch, getTrackedPlayers } = require('../../services/lol/lolGame');
const { createErrorEmbed } = require('../../utils/embedBuilder');
const { saveMatchData } = require('../../events/buttonInteraction');
const logger = require('../../utils/logger');

// Lista de jogadores para autocomplete
const players = require('../../config/players.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lol')
    .setDescription('Mostra a última partida de um jogador')
    .addStringOption((option) =>
      option
        .setName('summoner')
        .setDescription('Nome do invocador')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  /**
   * Handler de autocomplete
   */
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    const filtered = players
      .filter((player) => player.name.toLowerCase().includes(focusedValue))
      .slice(0, 10); // Máximo de 10 opções

    await interaction.respond(
      filtered.map((player) => ({
        name: player.name,
        value: player.name,
      }))
    );
  },

  async execute(interaction) {
    await interaction.deferReply();

    const summonerOption = interaction.options.getString('summoner');
    const playerName = summonerOption || 'Ticamenes';

    logger.info(`Buscando última partida de: ${playerName}`);

    try {
      const result = await getLastMatch(playerName);

      if (result) {
        const message = await interaction.editReply(result);
        
        // Salva dados para os botões interativos
        if (result.ranking) {
          saveMatchData(message.id, result.ranking);
        }
        
        logger.success(`Partida encontrada para ${playerName}`);
      } else {
        const trackedPlayers = getTrackedPlayers();
        const embed = createErrorEmbed(
          `Não foi possível encontrar a última partida de **${playerName}**.`,
          `**Jogadores monitorados:**\n${trackedPlayers.map(p => `• ${p}`).join('\n')}\n\nVerifique se o nome está correto ou tente novamente mais tarde.`
        );
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Erro ao buscar partida', error);
      const embed = createErrorEmbed(
        'Ocorreu um erro ao buscar a partida.',
        'Tente novamente em alguns segundos. Se o problema persistir, verifique se a API da Riot está funcionando.'
      );
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
