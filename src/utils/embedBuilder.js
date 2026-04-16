const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, RIOT_API, MEDIA_PATHS } = require('../config/constants');
const path = require('path');

/**
 * Utilitários para construção de embeds do Discord
 * Layout clean e minimalista
 */

/**
 * Retorna a URL do ícone do campeão
 */
const getChampionIcon = (championName) => {
	return `${RIOT_API.DDRAGON}/${championName}.png`;
};

/**
 * Códigos ANSI para cores no Discord
 */
const ANSI = {
	RESET: '\u001b[0m',
	BLUE: '\u001b[34m',
	RED: '\u001b[31m',
};

/**
 * Trunca texto para um tamanho máximo
 */
const truncate = (text, maxLength) => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 1) + '.';
};

/**
 * Cria um embed de resultado de partida - Layout Clean
 */
const createMatchResultEmbed = (isVictory, ranking, championName, metadata = {}) => {
	const gifName = isVictory ? 'ganhamo.gif' : 'perdemo.gif';
	const gifPath = path.join(MEDIA_PATHS.GIFS, gifName);
	const attachment = new AttachmentBuilder(gifPath, { name: gifName });

	// Formata jogador com cor ANSI - formato compacto sem número
	const formatPlayer = (player) => {
		const p = player.participant;
		const isBlue = p.teamId === 100;
		const color = isBlue ? ANSI.BLUE : ANSI.RED;
		const name = truncate(p.riotIdGameName, 14);
		const champ = truncate(p.championName, 10);
		return `${color}${name.padEnd(14)}${ANSI.RESET} ${champ.padEnd(10)} ${player.total}`;
	};

	// Lista única ordenada com cores ANSI
	const rankingText = ranking
		.map((player) => formatPlayer(player))
		.join('\n');

	// MVP
	const mvp = ranking[0];
	const modeLabel = metadata.modeLabel || 'Modo não identificado';
	const partialTag = metadata.eventLike ? ' | payload parcial' : '';

	const embed = new EmbedBuilder()
		.setColor(isVictory ? COLORS.VICTORY : COLORS.DEFEAT)
		.setTitle(isVictory ? 'VITÓRIA' : 'DERROTA')
		.setDescription(`\`\`\`ansi\n${rankingText}\n\`\`\``)
		.setThumbnail(getChampionIcon(mvp.participant.championName))
		.setImage(`attachment://${gifName}`)
		.setFooter({
			text:
				`MVP: ${mvp.participant.riotIdGameName} (${mvp.participant.championName}) · ${mvp.total}pts` +
				` | ${modeLabel}${partialTag}`,
		})
		.setTimestamp();

	// Botão para detalhes
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('match_details')
				.setLabel('Detalhes')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji('📊'),
		);

	return { embed, attachment, gifName, components: [row], ranking };
};

/**
 * Cria embed de detalhes - mostra pontuação por categoria
 */
const createMatchDetailsEmbed = (ranking) => {
	// Mostra pontuação por categoria com cores ANSI
	const formatPlayerDetails = (player) => {
		const p = player.participant;
		const isBlue = p.teamId === 100;
		const color = isBlue ? ANSI.BLUE : ANSI.RED;
		const name = truncate(p.riotIdGameName, 14);
		const champ = truncate(p.championName, 12);
		return [
			`${color}${name}${ANSI.RESET} (${champ}) ${player.total}pts`,
			`Dano:${player.damage} Part:${player.participation} KDA:${player.kda}`,
			`Tank:${player.tank} Vis:${player.vision} Tor:${player.towerDamage}`,
			`Cura:${player.healing} Esc:${player.shield}`,
		].join('\n');
	};

	const detailsText = ranking
		.map((player) => formatPlayerDetails(player))
		.join('\n\n');

	const embed = new EmbedBuilder()
		.setTitle('Detalhes da Partida')
		.setColor(COLORS.INFO)
		.setDescription(`\`\`\`ansi\n${detailsText}\n\`\`\``);

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('match_back')
				.setLabel('Voltar')
				.setStyle(ButtonStyle.Secondary),
		);

	return { embed, components: [row] };
};

/**
 * Cria um embed simples de informação
 */
const createInfoEmbed = (title, description, color = COLORS.INFO) => {
	return new EmbedBuilder()
		.setDescription(`**${title}**\n${description}`)
		.setColor(color);
};

/**
 * Cria um embed de erro
 */
const createErrorEmbed = (message, suggestion = null) => {
	let description = `❌ ${message}`;
	if (suggestion) {
		description += `\n\n💡 ${suggestion}`;
	}

	return new EmbedBuilder()
		.setDescription(description)
		.setColor(COLORS.DEFEAT);
};

/**
 * Cria um embed de sucesso
 */
const createSuccessEmbed = (title, message) => {
	return new EmbedBuilder()
		.setDescription(`✅ **${title}**\n${message}`)
		.setColor(COLORS.VICTORY);
};

/**
 * Cria um embed de áudio
 */
const createAudioEmbed = (audioName, queueInfo) => {
	const embed = new EmbedBuilder()
		.setColor(COLORS.INFO);

	if (queueInfo.queueLength > 0) {
		embed.setDescription(`🔊 **${audioName}**\nNa fila: ${queueInfo.queueLength}`);
	} else {
		embed.setDescription(`🔊 **${audioName}**`);
	}

	return embed;
};

module.exports = {
	createMatchResultEmbed,
	createMatchDetailsEmbed,
	createInfoEmbed,
	createErrorEmbed,
	createSuccessEmbed,
	createAudioEmbed,
	getChampionIcon,
};
