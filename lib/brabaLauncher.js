const ytdl = require('ytdl-core-discord');

const playSong = async (channel, url) => {
  try {
    const connection = await channel.join();
    const dispatcher = connection.play(await ytdl(url), { type: 'opus' });
    
    dispatcher.on('finish', () => {
      channel.leave();
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = { playSong };