const express = require("express");
const { json } = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(json());
app.use(cors());
app.listen(process.env.PORT || 3333);
const { keyLol } = require("../../config/config");
const headers = { headers: { "X-Riot-Token": keyLol } };

async function getGame(playerId) {
  let gameId = null;
  await axios
    .get(
      `https://br1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${playerId}`,
      headers
    )
    .then((e) => {
      gameId = e.status == 200 && `BR1_${e.data.gameId}`;
    })
    .catch(() => {});
  return gameId;
}

async function stillInGame(gameId) {
  let status = true;
  await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`,
      headers
    )
    .then((e) => {
      status = e.status != 200;
    })
    .catch(() => {});
  return status;
}

async function getParticipants(gameId) {
  let participants = null;
  await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`,
      headers
    )
    .then((e) => {
      participants = e.status == 200 && e.data.info.participants;
    })
    .catch(() => {});
  return participants;
}

async function getLastGameParticipants(puuid) {
  let gameId = "";
  await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`,
      headers
    )
    .then((e) => {
      gameId = e.status == 200 && e.data[0];
    })
    .catch((e) => {
      console.log(e);
    });
  return gameId;
}

module.exports = {
  getGame,
  stillInGame,
  getParticipants,
  getLastGameParticipants,
};
