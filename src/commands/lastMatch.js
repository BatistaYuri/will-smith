const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const lolService = require("../api/services/lolService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol")
    .setDescription("Last match")
    .addStringOption((option) =>
      option.setName("summoner").setDescription("nome do palhaço")
    ),

  async execute(interaction) {
    const summoner = interaction.options.get("summoner");
    const playerName = summoner ? summoner.value : "Ticamenes";
    const embed = await lolService.getLastGame(playerName);
    if (embed) {
      interaction
        .reply(embed)
        .then(() => console.log("Reply sent."))
        .catch(console.error);
    }
  },
};
