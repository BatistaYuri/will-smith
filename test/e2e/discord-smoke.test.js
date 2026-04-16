const test = require('node:test');
const assert = require('node:assert/strict');

let discord = null;
let embedBuilder = null;
let config = null;
let loadError = null;

try {
  discord = require('discord.js');
  embedBuilder = require('../../src/utils/embedBuilder');
  config = require('../../src/config');
} catch (error) {
  loadError = error;
}

const token = config?.token;
const guildId = config?.guildId;
const testTextChannelName = config?.channels?.text;

const skipReason = (() => {
  if (loadError) {
    const detail = loadError.message || loadError.code || 'erro desconhecido';
    return `Dependência ausente para E2E: ${detail}`;
  }

  if (!token) {
    return 'Token ausente. Defina TOKEN em .env.development.';
  }

  if (!guildId) {
    return 'Guild ausente. Defina GUILD_ID em .env.development.';
  }

  if (!testTextChannelName) {
    return 'Canal de texto ausente. Verifique channels.text em config.';
  }

  return null;
})();

const maybeTest = (name, fn) => {
  if (skipReason) {
    test(name, { skip: skipReason }, fn);
    return;
  }

  test(name, fn);
};

maybeTest('Discord smoke: login, send embed with component and cleanup', async () => {
  const {
    Client,
    GatewayIntentBits,
    ChannelType,
  } = discord;

  const {
    createInfoEmbed,
    createMatchDetailsEmbed,
  } = embedBuilder;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  let targetChannel = null;

  try {
    await client.login(token);

    const guild = await client.guilds.fetch(guildId);
    assert.ok(guild);

    await guild.channels.fetch();

    const channel = guild.channels.cache.find(
      (c) => c.name === testTextChannelName
    );

    assert.ok(channel, `Canal '${testTextChannelName}' não encontrado`);
    targetChannel = channel;

    const isTextLike =
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.GuildAnnouncement;

    assert.equal(isTextLike, true, 'Canal de teste precisa ser de texto');

    const smokeEmbed = createInfoEmbed(
      'E2E Smoke',
      'Mensagem de validação automática (pode apagar).'
    );

    const smokeMessage = await targetChannel.send({
      content: '[E2E] smoke',
      embeds: [smokeEmbed],
    });

    assert.ok(smokeMessage.id);
    assert.equal(smokeMessage.embeds.length > 0, true);

    const sampleRanking = [
      {
        participant: {
          riotIdGameName: 'TesterBlue',
          championName: 'Ashe',
          teamId: 100,
        },
        total: 100,
        damage: 20,
        participation: 20,
        kda: 20,
        tank: 10,
        vision: 10,
        towerDamage: 5,
        healing: 10,
        shield: 5,
      },
    ];

    const { embed, components } = createMatchDetailsEmbed(sampleRanking);

    const componentMessage = await targetChannel.send({
      content: '[E2E] component',
      embeds: [embed],
      components,
    });

    assert.ok(componentMessage.id);
    assert.equal(componentMessage.components.length, 1);
    assert.equal(componentMessage.components[0].components.length, 1);
    assert.equal(componentMessage.components[0].components[0].customId, 'match_back');
  } finally {
    // Mantém as mensagens no canal para inspeção manual.
    await client.destroy();
  }
});
