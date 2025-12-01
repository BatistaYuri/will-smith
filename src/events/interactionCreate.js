const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { createErrorEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction) {
    // Handler de Autocomplete
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      
      if (!command || !command.autocomplete) {
        return;
      }
      
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        logger.error(`Erro no autocomplete: ${interaction.commandName}`, error);
      }
      return;
    }

    // Handler de Comandos Slash
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Comando não encontrado: ${interaction.commandName}`);
        return;
      }

      try {
        logger.debug(`Executando comando: ${interaction.commandName}`);
        await command.execute(interaction);
      } catch (error) {
        logger.error(`Erro ao executar comando: ${interaction.commandName}`, error);

        const embed = createErrorEmbed(
          'Ocorreu um erro ao executar esse comando.',
          'Tente novamente em alguns segundos. Se o problema persistir, contate o administrador.'
        );

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [embed], ephemeral: true });
          } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
          }
        } catch (replyError) {
          logger.error('Erro ao enviar mensagem de erro', replyError);
        }
      }
    }
  },
};
