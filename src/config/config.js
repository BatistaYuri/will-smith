require("dotenv").config();
module.exports = {
  prefix: "-w",
  prefixSong: "-toca",
  prefixStopSong: "-sai",
  token: process.env.TOKEN,
  keyLol: process.env.LOL_KEY,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
};
