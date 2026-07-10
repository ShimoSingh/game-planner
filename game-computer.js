function initializePVPIndices(players) {
    const pvpIndices = {};
    players.forEach(player => {
        pvpIndices[player] = {};
        players.forEach(otherPlayer => {
            if(player !== otherPlayer) {
                pvpIndices[player][otherPlayer] = 0;
            }
        });
    });
    return pvpIndices;
}

function computeTeamPairs(pvpIndices, availablePlayers) {
    const teamPairs = [];
    while(availablePlayers.length > 0) {
        let player = availablePlayers.shift();
        let teamMate = availablePlayers[0];
        let currIdxMap = pvpIndices[player];
        availablePlayers.forEach(p => {
            if(currIdxMap[p] < currIdxMap[teamMate]) {
                teamMate = p;
            }
        });
        teamPairs.push([player, teamMate]);
        availablePlayers = availablePlayers.filter(p => p !== teamMate);
    }
    return teamPairs;
}

function computeGames(teamPairs, pvpIndices) {
    const games = [];
    while(teamPairs.length > 0) {
        const game = [];
        const firstTeam = teamPairs.shift();
        game.push(...firstTeam);
        let secondTeam = teamPairs[0];
        let minPVPCount = Infinity;
        teamPairs.forEach((team, index) => {
            let pvpCount = pvpIndices[firstTeam[0]][team[0]] + pvpIndices[firstTeam[1]][team[1]];
            pvpCount += pvpIndices[firstTeam[0]][team[1]] + pvpIndices[firstTeam[1]][team[0]];
            if(pvpCount < minPVPCount) {
                minPVPCount = pvpCount;
                secondTeam = team;
            }
        });
        game.push(...secondTeam);
        games.push(game);
        teamPairs = teamPairs.filter(team => team !== secondTeam);
    }
    return games;
}

function updatePVPIndices(pvpIndices, games) {
    games.forEach(game => {
        const [player1, player2, player3, player4] = game;
        pvpIndices[player1][player2]++;
        pvpIndices[player1][player3] += 0.5;
        pvpIndices[player1][player4] += 0.5;
        pvpIndices[player2][player1]++;
        pvpIndices[player2][player3] += 0.5;
        pvpIndices[player2][player4] += 0.5;
        pvpIndices[player3][player1] += 0.5;
        pvpIndices[player3][player2] += 0.5;
        pvpIndices[player3][player4]++;
        pvpIndices[player4][player1] += 0.5;
        pvpIndices[player4][player2] += 0.5;
        pvpIndices[player4][player3]++;
    });
}

function generateMatches(rounds) {
    const matches = [];
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const numberOfRestPlayers = shuffledPlayers.length % 4;
    const pvpIndices = initializePVPIndices(shuffledPlayers);
    for(let i = 0; i < rounds; i++) {
        const match = {};
        const restPlayers = [];
        for(let j = 0; j < numberOfRestPlayers; j++) {
            normalizedIndex = (j + i * numberOfRestPlayers) % shuffledPlayers.length;
            restPlayers.push(shuffledPlayers[shuffledPlayers.length - 1 - normalizedIndex]);
        }
        let availablePlayers = shuffledPlayers.filter(player => !restPlayers.includes(player));
        match.restPlayers = restPlayers;
        let teamPairs = computeTeamPairs(pvpIndices, availablePlayers);
        match.games = computeGames(teamPairs, pvpIndices);
        matches.push(match);
        updatePVPIndices(pvpIndices, match.games);
    }
    return matches;
}