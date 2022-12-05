const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayersDetailsObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertMatchScoreDetailsObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayersDetailsObject(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      player_name
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`;
  const result = await database.get(getPlayerQuery);
  response.send(convertPlayersDetailsObject(result));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    UPDATE
     player_details
    SET
      player_id=${playerId},
      player_name='${playerName}'
    WHERE
      player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id = ${matchId};`;
  const matchDetails = await database.get(getMatchQuery);
  response.send(convertMatchDetailsObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsPlayers = `
    SELECT
      *
    FROM
      match_details join player_details
    WHERE 
    player_id=${playerId};`;
  const playerMatchDetails = await database.all(getMatchDetailsPlayers);
  console.log(playerMatchDetails);
  response.send(convertPlayersDetailsObject(playerMatchDetails));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsSpecificMatch = `
    SELECT
      *
    FROM
      player_details join match_details
    WHERE 
    match_id=${matchId};`;
  const playerMatchDetailsOfaMatch = await database.all(
    getMatchDetailsSpecificMatch
  );
  console.log(playerMatchDetailsOfaMatch);
  response.send(convertMatchDetailsObject(playerMatchDetailsOfaMatch));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT
      SUM(score),
      SUM(fours),
      SUM(sixes)
    FROM
      player_match_score
    Where
      player_id=${playerId};`;
  const stats = await database.get(getPlayerStatsQuery);
  console.log(stats);
  response.send({
    totalScore: stats["SUM(score)"],
    totalFours: stats["SUM(fours)"],
    totalSixes: stats["SUM(sixes)"],
  });
});

module.exports = app;
