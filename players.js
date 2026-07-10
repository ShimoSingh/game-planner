let players = JSON.parse(localStorage.getItem('players')) || [];
reRenderPlayerList();

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
    if(players.length < 4) {
        document.getElementById('player-list-info').classList.remove('d-none');
    } else {
        document.getElementById('player-list-info').classList.add('d-none');
    }
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
