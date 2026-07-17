function initializePVPIndices(players) {
    return players.reduce((acc, player) => {
        acc[player] = {};
        players.forEach(otherPlayer => {
            if(player !== otherPlayer) {
                acc[player][otherPlayer] = 0;
            }
        });
        return acc;
    }, {});
}

function computeTeamPairs(round, players) {
    const teamPairs = [];
    const rotatedPlayers = rotatePlayers(players, round);
    for(let i = 0; i < rotatedPlayers.length/2; i ++) {
        teamPairs.push([rotatedPlayers[i], rotatedPlayers[rotatedPlayers.length - 1 - i]]);
    }
    let [teams, restPlayers] = teamPairs.reduce((acc, team) => {
        if(team[0] === null || team[1] === null) {
            acc[1].push(team[0] || team[1]);
        } else {
            acc[0].push(team);
        }
        return acc;
    }, [[], []]);
    return [teams, restPlayers];
}

function rotatePlayers(players, round) {
    const playersCopy = [...players];
    let anchor = playersCopy.shift();
    for(let i = 0; i < round; i++) {
        playersCopy.unshift(playersCopy.pop());
    }
    playersCopy.unshift(anchor);
    return playersCopy;
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
        pvpIndices[player1][player3] += 0.5;
        pvpIndices[player1][player4] += 0.5;
        pvpIndices[player2][player3] += 0.5;
        pvpIndices[player2][player4] += 0.5;
        pvpIndices[player3][player1] += 0.5;
        pvpIndices[player3][player2] += 0.5;
        pvpIndices[player4][player1] += 0.5;
        pvpIndices[player4][player2] += 0.5;
    });
}

function generateMatches(rounds) {
    const matches = [];
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const numberOfRestPlayers = shuffledPlayers.length % 4;
    const pvpIndices = initializePVPIndices(shuffledPlayers);
    for(let j = 0; j < numberOfRestPlayers; j++) {
        shuffledPlayers.push(null);
    }
    for(let i = 0; i < rounds; i++) {
        const match = {};        
        let [teamPairs, restPlayers] = computeTeamPairs(i, shuffledPlayers);
        match.restPlayers = restPlayers;
        match.games = computeGames(teamPairs, pvpIndices);
        matches.push(match);
        updatePVPIndices(pvpIndices, match.games);
    }
    return matches;
}