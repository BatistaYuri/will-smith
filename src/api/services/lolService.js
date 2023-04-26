const axios = require("axios");
const { keyLol } = require('../../config/config');
const headers = { headers: { "X-Riot-Token": keyLol } };

async function inGame() {
    await axios.get(`https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${jogador.id}`, headers)
        .then((e) => {
            return e.status == 200 && `BR1_${e.data.gameId}`;
         }).catch(() => { return false })
};

async function stillInGame(gameId) {
    await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`, headers)
        .then((e) => {
            return e.status != 200
        }).catch(() => { return true })
};

async function getParticipants(gameId) {
    await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`, headers)
        .then((e) => {
            return e.status == 200 && e.data.info.participants
        }).catch(() => { return null })
};

module.exports = {
    inGame,
    stillInGame,
    getParticipants
};
