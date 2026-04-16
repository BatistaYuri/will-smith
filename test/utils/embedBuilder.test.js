const test = require('node:test');
const assert = require('node:assert/strict');

let embedBuilder = null;
let loadError = null;

try {
  embedBuilder = require('../../src/utils/embedBuilder');
} catch (error) {
  loadError = error;
}

const {
  createMatchResultEmbed,
  createMatchDetailsEmbed,
  createInfoEmbed,
  createErrorEmbed,
  createSuccessEmbed,
  createAudioEmbed,
  getChampionIcon,
} = embedBuilder || {};

const maybeTest = (name, fn) => {
  if (loadError) {
    test(name, { skip: `Dependência ausente para embedBuilder: ${loadError.code || loadError.message}` }, fn);
    return;
  }
  test(name, fn);
};

const sampleRanking = [
  {
    participant: {
      riotIdGameName: 'VeryLongPlayerNameXYZ',
      championName: 'MissFortune',
      teamId: 100,
    },
    total: 120.5,
    damage: 20,
    participation: 20,
    kda: 20,
    tank: 10,
    vision: 5,
    towerDamage: 5,
    healing: 8,
    shield: 7,
  },
  {
    participant: {
      riotIdGameName: 'Enemy',
      championName: 'Lux',
      teamId: 200,
    },
    total: 80,
    damage: 10,
    participation: 10,
    kda: 10,
    tank: 10,
    vision: 10,
    towerDamage: 10,
    healing: 10,
    shield: 10,
  },
];

maybeTest('createMatchResultEmbed includes mode metadata in footer', () => {
  const { embed, components } = createMatchResultEmbed(true, sampleRanking, 'MissFortune', {
    modeLabel: 'ARAM Mayhem-like',
    eventLike: true,
  });

  const json = embed.toJSON();
  assert.equal(json.title, 'VITÓRIA');
  assert.ok(json.footer.text.includes('ARAM Mayhem-like'));
  assert.ok(json.footer.text.includes('payload parcial'));
  assert.equal(components[0].components[0].data.custom_id, 'match_details');
});

maybeTest('createMatchDetailsEmbed returns details embed and back button', () => {
  const { embed, components } = createMatchDetailsEmbed(sampleRanking);
  const json = embed.toJSON();

  assert.equal(json.title, 'Detalhes da Partida');
  assert.ok(json.description.includes('Dano:'));
  assert.equal(components[0].components[0].data.custom_id, 'match_back');
});

maybeTest('createInfo/Error/Success embeds format expected messages', () => {
  const info = createInfoEmbed('Titulo', 'Descricao').toJSON();
  const err = createErrorEmbed('Falhou', 'Tente de novo').toJSON();
  const success = createSuccessEmbed('OK', 'Concluido').toJSON();

  assert.ok(info.description.includes('Titulo'));
  assert.ok(err.description.includes('❌'));
  assert.ok(err.description.includes('💡'));
  assert.ok(success.description.includes('✅'));
});

maybeTest('createAudioEmbed shows queue length only when needed', () => {
  const withQueue = createAudioEmbed('ganhamo', { queueLength: 2 }).toJSON();
  const withoutQueue = createAudioEmbed('ganhamo', { queueLength: 0 }).toJSON();

  assert.ok(withQueue.description.includes('Na fila: 2'));
  assert.equal(withoutQueue.description.includes('Na fila'), false);
});

maybeTest('getChampionIcon builds ddragon URL', () => {
  const url = getChampionIcon('Ashe');
  assert.ok(url.includes('/Ashe.png'));
});
