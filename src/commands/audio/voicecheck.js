const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const logger = require('../../utils/logger');

const CONNECT_TIMEOUT_MS = 8000;

const buildPermissionReport = (permissions) => {
  const checks = [
    { label: 'Ver Canal', flag: PermissionsBitField.Flags.ViewChannel },
    { label: 'Conectar', flag: PermissionsBitField.Flags.Connect },
    { label: 'Falar', flag: PermissionsBitField.Flags.Speak },
    { label: 'Usar Detecção de Voz', flag: PermissionsBitField.Flags.UseVAD },
  ];

  return checks.map((item) => ({
    label: item.label,
    allowed: Boolean(permissions?.has(item.flag)),
  }));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicecheck')
    .setDescription('Diagnostica conexão de voz e permissões do bot'),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Entre em um canal de voz para executar o diagnóstico.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const botMember = guild.members.me || (await guild.members.fetchMe());
    const permissions = voiceChannel.permissionsFor(botMember);

    const permissionReport = buildPermissionReport(permissions);
    const missingPermissions = permissionReport
      .filter((entry) => !entry.allowed)
      .map((entry) => entry.label);

    const states = [];
    let connection = null;
    let connectionResult = 'Não testado';

    if (missingPermissions.length > 0) {
      connectionResult = `Pulado: faltam permissões (${missingPermissions.join(', ')})`;
    } else {
      try {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: false,
        });

        connection.on('stateChange', (oldState, newState) => {
          states.push(`${oldState.status} -> ${newState.status}`);
        });

        await entersState(connection, VoiceConnectionStatus.Ready, CONNECT_TIMEOUT_MS);
        connectionResult = `OK: conexão pronta em até ${CONNECT_TIMEOUT_MS / 1000}s`;
      } catch (error) {
        connectionResult = `Falhou: ${error.name || 'Error'} - ${error.message}`;
        logger.warn('voicecheck: falha ao testar conexão de voz', {
          guildId: guild.id,
          channelId: voiceChannel.id,
          error: error.message,
          states,
        });
      } finally {
        try {
          connection?.destroy();
        } catch (_error) {
          // Ignore cleanup failures.
        }
      }
    }

    const permissionsText = permissionReport
      .map((entry) => `${entry.allowed ? '✅' : '❌'} ${entry.label}`)
      .join('\n');

    const statesText = states.length > 0 ? states.join('\n') : 'Sem transições capturadas';

    const embed = new EmbedBuilder()
      .setColor(missingPermissions.length > 0 ? 0xffcc00 : 0x0099ff)
      .setTitle('Diagnóstico de Voz')
      .addFields(
        {
          name: 'Canal',
          value: `${voiceChannel.name} (${voiceChannel.type})`,
          inline: false,
        },
        {
          name: 'Permissões efetivas',
          value: permissionsText,
          inline: false,
        },
        {
          name: 'Teste de conexão',
          value: connectionResult,
          inline: false,
        },
        {
          name: 'Transições de estado',
          value: statesText.slice(0, 1000),
          inline: false,
        }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
