const express = require("express");
const { json } = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(json());
app.use(cors());
app.listen(process.env.PORT || 3333);
const { keyLol } = require('../../config/config');
const headers = { headers: { "X-Riot-Token": keyLol } };

async function getGame(playerId) {
    await axios.get(`https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${playerId}`, headers)
        .then((e) => {
            return e.status == 200 && `BR1_${e.data.gameId}`;
         }).catch(() => { return null })
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

async function getLastGameParticipants(puuid) {
    await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`, headers)
        .then((e) => {
            console.log(e);
            const teste = e.status == 200 ? e.data[0] : null;
            return e.status == 200 ? e.data[0] : null;
        }).catch(() => { return null })
}

module.exports = {
    getGame,
    stillInGame,
    getParticipants,
    getLastGameParticipants
};
