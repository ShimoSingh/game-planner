let matches = JSON.parse(localStorage.getItem('matches')) || [];
let savedMatches = JSON.parse(localStorage.getItem('allMatches')) || {};
reRenderMatches();
reRenderSavedMatches();

function reRenderSavedMatches() {
    const savedMatchesList = document.getElementById('saved-matches-list');
    savedMatchesList.innerHTML = '';
    Object.keys(savedMatches).forEach((key, index) => {
        const match = savedMatches[key];
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.textContent = key;
        const buttonDiv = document.createElement('div');
        listItem.appendChild(buttonDiv);
        const loadButton = document.createElement('button');
        loadButton.className = 'btn btn-primary btn-sm';
        loadButton.textContent = 'Load';
        loadButton.addEventListener('click', function() {
            matches = match;
            localStorage.setItem('matches', JSON.stringify(matches));
            reRenderMatches();
        });
        buttonDiv.appendChild(loadButton);
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm ms-2';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            delete savedMatches[key];
            localStorage.setItem('allMatches', JSON.stringify(savedMatches));
            reRenderSavedMatches();
        });
        buttonDiv.appendChild(deleteButton);
        savedMatchesList.appendChild(listItem);
    });
}

document.getElementById('save-button').addEventListener('click', function() {
    const matchName = prompt('Enter a name for the match:');
    if(matchName) {
        savedMatches[matchName] = matches;
        localStorage.setItem('allMatches', JSON.stringify(savedMatches));
        reRenderSavedMatches();
    }
});

document.getElementById('clear-button').addEventListener('click', function() {
    if(confirm('Are you sure you want to clear the current matches?')) {
        matches = [];
        localStorage.setItem('matches', JSON.stringify(matches));
        reRenderMatches();
    }
});

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
    gameNumberCol.className = 'col-2 col-lg-1 text-center fw-bold';
    gameNumberCol.textContent = `Game ${gameIndex + 1}`;
    gameContent.appendChild(gameNumberCol);
    const playersCol = document.createElement('div');
    playersCol.className = 'row col-10 col-lg-11';
    gameContent.appendChild(playersCol);
    addTeamCol(game.slice(0, 2), playersCol, 'start');
    addScoreInput(playersCol);
    addScoreInput(playersCol, "order-1");
    addTeamCol(game.slice(2, 4), playersCol, 'end');
    listItem.appendChild(gameContent);
}

function addScoreInput(playersCol, orderClass) {
    const scoreCol = document.createElement('div');
    scoreCol.className = 'col-5 col-md-2 row order-md-0';
    scoreCol.classList.add(orderClass);
    const scoreInput = document.createElement('input');
    scoreInput.type = 'text';
    scoreInput.className = 'col-10 mb-2 mb-md-0 text-center js-score-input';
    scoreInput.placeholder = 'Score';
    scoreCol.appendChild(scoreInput);
    playersCol.appendChild(scoreCol);
}

function addTeamCol(team, gameContent, position) {
    const gameTeamsCol = document.createElement('div');
    gameTeamsCol.className = `col-7 col-md-4 text-md-${position}`;
    gameTeamsCol.textContent = team.join(' & ');
    gameContent.appendChild(gameTeamsCol);
}

document.getElementById('download-button').addEventListener('click', function() {
    document.querySelectorAll('.js-score-input').forEach(input => {
        input.placeholder = '';
    });
    html2canvas(document.getElementById('games-list'), {windowWidth: "1200"}).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'matches.png';
        link.click();
    });
    document.querySelectorAll('.js-score-input').forEach(input => {
        input.placeholder = 'Score';
    });
});