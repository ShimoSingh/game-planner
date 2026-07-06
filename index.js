let players = JSON.parse(localStorage.getItem('players')) || [];
let matches = JSON.parse(localStorage.getItem('matches')) || [];
reRenderPlayerList();
reRenderMatches();
document.getElementById('player-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const playerName = document.getElementById('player-name').value.trim();
    if(players.includes(playerName)) {
        alert('Player already exists!');
        return;
    }
    players.push(playerName);
    reRenderPlayerList();
    document.getElementById('player-name').value = '';
});

document.getElementById('player-form').addEventListener('reset', function(event) {
    players = [];
    reRenderPlayerList();
});

function reRenderPlayerList() {
    localStorage.setItem('players', JSON.stringify(players));
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
    players.forEach((player, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = `${index + 1}. ${player}`;
        playerList.appendChild(listItem);
        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-danger btn-sm float-end';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function() {
            players = players.filter(p => p !== player);
            reRenderPlayerList();
        });
        listItem.appendChild(removeButton);
    });
}

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

document.getElementById('generate-matches').addEventListener('click', function() {
    const numRounds = parseInt(document.getElementById('num-rounds').value);
    if(players.length < 4) {
        alert('At least 4 players are required to generate matches.');
        return;
    }
    if(isNaN(numRounds) || numRounds < 1) {
        alert('Please enter a valid number of rounds.');
        return;
    }
    matches = generateMatches(numRounds);
    localStorage.setItem('matches', JSON.stringify(matches));
    reRenderMatches();
});

function reRenderMatches() {
    if(matches.length === 0) {
        document.querySelector('.js-generated-games-container').classList.add('d-none');
        return;
    }
    document.querySelector('.js-generated-games-container').classList.remove('d-none');
    const gamesList = document.getElementById('games-list');
    gamesList.innerHTML = '';
    matches.forEach((match, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item p-0';
        const gameTitle = document.createElement('h4');
        gameTitle.classList.add('text-center', 'text-bg-primary', 'p-1', 'mb-0');
        gameTitle.textContent = `Round ${index + 1}`;
        listItem.appendChild(gameTitle);
        match.games.forEach((game, gameIndex) => {
            renderGame(game, gameIndex, listItem);
        });
        if(match.restPlayers.length > 0) {
            const restPlayersContent = document.createElement('p');
            restPlayersContent.className = 'p-1';
            restPlayersContent.textContent = 'Rest Players: ' + match.restPlayers.join(', ');
            listItem.appendChild(restPlayersContent);
        }
        gamesList.appendChild(listItem);
    });
}

function renderGame(game, gameIndex, listItem) {
    const gameContent = document.createElement('div');
    gameContent.className = 'row p-1 align-items-center bg-primary-subtle border-bottom border-primary-subtle';
    const gameNumberCol = document.createElement('div');
    gameNumberCol.className = 'col-2 col-lg-1';
    gameNumberCol.textContent = `Game ${gameIndex + 1}`;
    gameContent.appendChild(gameNumberCol);
    addTeamCol(game.slice(0, 2), gameContent, 'start');
    const scoreCol = document.createElement('div');
    scoreCol.className = 'col-3 row justify-content-between';
    addScoreInput(scoreCol);
    addScoreInput(scoreCol);
    gameContent.appendChild(scoreCol);
    addTeamCol(game.slice(2, 4), gameContent, 'end');
    listItem.appendChild(gameContent);
}

function addScoreInput(scoreCol) {
    const scoreInput = document.createElement('input');
    scoreInput.type = 'text';
    scoreInput.className = 'col-5 text-center';
    scoreInput.placeholder = 'Score';
    scoreCol.appendChild(scoreInput);
}

function addTeamCol(team, gameContent, position) {
    const gameTeamsCol = document.createElement('div');
    gameTeamsCol.className = `col-3 col-lg-4 text-${position}`;
    gameTeamsCol.textContent = team.join(' & ');
    gameContent.appendChild(gameTeamsCol);
}

document.getElementById('download-button').addEventListener('click', function() {
    html2canvas(document.getElementById('games-list')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'matches.png';
        link.click();
    });
});