/**
 * Constantes do sistema
 */

// URLs da API da Riot
const RIOT_API = {
  BR: 'https://br1.api.riotgames.com',
  AMERICAS: 'https://americas.api.riotgames.com',
  DDRAGON: 'https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion',
};

// Endpoints da API
const ENDPOINTS = {
  SPECTATOR: '/lol/spectator/v5/active-games/by-summoner',
  MATCH: '/lol/match/v5/matches',
  MATCH_BY_PUUID: '/lol/match/v5/matches/by-puuid',
};

// Pesos para cálculo de pontos
const POINT_WEIGHTS = {
  DAMAGE: 25,
  VISION: 10,
  TOWER_DAMAGE: 10,
  PARTICIPATION: 27.5,
  HEALING: 12.5,
  SHIELD: 12.5,
  TANK: 12.5,
  KDA: 22.5,
  WIN_BONUS: 5,
};

// Caminhos dos arquivos de mídia
const MEDIA_PATHS = {
  AUDIOS: './public/audios',
  AUDIOS_FPS: './public/audios-fps',
  GIFS: './public/gifs',
  IMAGES: './public/images',
};

// Cores para embeds
const COLORS = {
  VICTORY: 0x00ff00,
  DEFEAT: 0xff0000,
  INFO: 0x0099ff,
  WARNING: 0xffcc00,
};

module.exports = {
  RIOT_API,
  ENDPOINTS,
  POINT_WEIGHTS,
  MEDIA_PATHS,
  COLORS,
};
