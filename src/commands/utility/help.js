const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

// Categorias dos comandos (comandos não listados vão para "Outros")
const CATEGORIES = {
  '🎮 Controle de Áudio': ['stop', 'skip', 'queue', 'clear'],
  '🔢 FPS': ['fps'],
  '🎮 League of Legends': ['lol'],
  '⚙️ Utilidades': ['status', 'help'],
};

// Comandos que são de áudio (todos os outros que não estão nas categorias acima)
const AUDIO_CONTROL = ['stop', 'skip', 'queue', 'clear', 'fps', 'lol', 'status', 'help'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra todos os comandos disponíveis'),

  async execute(interaction) {
    await interaction.deferReply();
    
    const commands = interaction.client.commands;
    
    // Busca os comandos registrados na guild para pegar os IDs (para links clicáveis)
    const commandIdMap = new Map();
    try {
      const guildCommands = await interaction.guild.commands.fetch();
      guildCommands.forEach(cmd => {
        commandIdMap.set(cmd.name, cmd.id);
      });
    } catch {
      // Se falhar, tenta buscar comandos globais
      const globalCommands = await interaction.client.application.commands.fetch();
      globalCommands.forEach(cmd => {
        commandIdMap.set(cmd.name, cmd.id);
      });
    }
    
    // Função para formatar comando como link clicável
    const formatCommand = (name) => {
      const id = commandIdMap.get(name);
      return id ? `</${name}:${id}>` : `\`/${name}\``;
    };
    
    // Separa comandos de áudio dos outros
    const audioCommands = [];
    const categorizedCommands = {};
    
    // Inicializa categorias
    for (const category of Object.keys(CATEGORIES)) {
      categorizedCommands[category] = [];
    }
    
    // Organiza os comandos
    commands.forEach((cmd) => {
      const name = cmd.data.name;
      const description = cmd.data.description;
      
      // Verifica se pertence a alguma categoria específica
      let found = false;
      for (const [category, cmdList] of Object.entries(CATEGORIES)) {
        if (cmdList.includes(name)) {
          categorizedCommands[category].push({ name, description });
          found = true;
          break;
        }
      }
      
      // Se não está em nenhuma categoria, é comando de áudio
      if (!found && !AUDIO_CONTROL.includes(name)) {
        audioCommands.push({ name, description });
      }
    });
    
    // Monta o embed
    const embed = new EmbedBuilder()
      .setTitle('📚 Comandos do Will Smith Bot')
      .setColor(COLORS.INFO)
      .setDescription(`Total de **${commands.size}** comandos disponíveis\n*Clique em um comando para usá-lo!*`);
    
    // Adiciona comandos de áudio
    if (audioCommands.length > 0) {
      const audioList = audioCommands
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(cmd => formatCommand(cmd.name))
        .join(' ');
      
      embed.addFields({
        name: `🔊 Áudios (${audioCommands.length})`,
        value: audioList,
        inline: false,
      });
    }
    
    // Adiciona outras categorias
    for (const [category, cmds] of Object.entries(categorizedCommands)) {
      if (cmds.length > 0) {
        const cmdList = cmds
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(cmd => `${formatCommand(cmd.name)} - ${cmd.description}`)
          .join('\n');
        
        embed.addFields({
          name: category,
          value: cmdList,
          inline: false,
        });
      }
    }
    
    embed
      .setFooter({ text: 'Will Smith Bot 🤖' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

