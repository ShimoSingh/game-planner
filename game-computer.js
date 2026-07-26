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
    if(teams.length % 2 != 0) {
        return [null, null]
    }
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

function computeGames(teamPairs) {
    const games = [];
    while(teamPairs.length > 0) {
        const game = [...teamPairs.shift(), ...teamPairs.shift()];
        games.push(game);
    }
    return games;
}

function updatePVPIndices(pvpIndices, teamSet) {
    teamSet.forEach(teamPairs => {
        incrementPVPIndexForRound(teamPairs, pvpIndices);
    });
}

function rearrangeTeams(teamsSet, pvpIndices) {
    // find possibilities
    let possibilities = teamsSet.map(teamPairs => calculatePossibleMatchups([...teamPairs]));
    // set initialPVPs
    updatePVPIndices(pvpIndices, teamsSet);
    // traverse round by round
    let variance = findPVPVariance(pvpIndices)
    let maxClubbing = Math.max(5 - (possibilities[0].length + '').length, 1)
    let clubbedTeams = Math.min(possibilities.length, maxClubbing);
    let permutations = Math.pow(possibilities[0].length, clubbedTeams);
    
    for(let i = 0; possibilities.length > i + clubbedTeams; i++) {
        for(let j = 0; j < permutations; j++) {
            let indexQuotient = j;
            let currPossibilities = []
            for(let k = 0; k < clubbedTeams; k++) {
                let psbltyIndex = k + i;
                revertPVPIndexForRound(teamsSet[psbltyIndex], pvpIndices)
                currPossibilities[k] = possibilities[psbltyIndex][indexQuotient % possibilities[0].length]
                incrementPVPIndexForRound(currPossibilities[k], pvpIndices)
                indexQuotient = Math.floor(indexQuotient / possibilities[0].length)
            }
            let currVariance = findPVPVariance(pvpIndices)
            if(currVariance < variance) {
                variance = currVariance
                for(let k = 0; k < clubbedTeams; k++) {
                    let psbltyIndex = k + i;
                    teamsSet[psbltyIndex] = currPossibilities[k];
                }
            } else {
                for(let k = 0; k < clubbedTeams; k++) {
                    let psbltyIndex = k + i;
                    revertPVPIndexForRound(currPossibilities[k], pvpIndices)
                    incrementPVPIndexForRound(teamsSet[psbltyIndex], pvpIndices)
                }
            }
        }
    }
}

function allPVPsAreTwo(pvpIndices) {
    for(const player in pvpIndices) {
        for(const otherPlayer in pvpIndices[player]) {
            if(pvpIndices[player][otherPlayer] !== 2) {
                return false;
            }
        }
    }
    return true;
}

function generateMatches(rounds) {
    const matches = [];
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const numberOfRestPlayers = shuffledPlayers.length % 4;
    const pvpIndices = initializePVPIndices(shuffledPlayers);
    for(let j = 0; j < numberOfRestPlayers; j++) {
        let idxForNull = Math.floor((j + 1)/numberOfRestPlayers * shuffledPlayers.length);
        // insert null to shuffledPlayers at idxForNull
        shuffledPlayers.splice(idxForNull, 0, null)
    }
    let idealRounds = players.length + (players.length % 4) - 1;

    const teamsSet = [];
    const restSet = [];
    for(let i = 0; i < idealRounds; i++) {
        let [teamPairs, restPlayers] = computeTeamPairs(i, shuffledPlayers);
        if(teamPairs != null) {
            teamsSet.push(teamPairs);
            restSet.push(restPlayers);
        }
    }

    rearrangeTeams(teamsSet, pvpIndices);

    for(let i = 0; i < rounds; i++) {
        const match = {};
        match.restPlayers = restSet[i % teamsSet.length];
        match.games = computeGames([...teamsSet[i % teamsSet.length]]);
        matches.push(match);
    }
    return matches;
}

function updatePVPIndexForRound(teamPairs, pvpIndices, change) {
	let teamPairsCp = [...teamPairs];
    while(teamPairsCp.length > 0) {
        const [player1, player2] = teamPairsCp.shift();
        const [player3, player4] = teamPairsCp.shift();
        pvpIndices[player1][player3] += change;
        pvpIndices[player1][player4] += change;
        pvpIndices[player2][player3] += change;
        pvpIndices[player2][player4] += change;
        pvpIndices[player3][player1] += change;
        pvpIndices[player3][player2] += change;
        pvpIndices[player4][player1] += change;
        pvpIndices[player4][player2] += change;
    }
}

function revertPVPIndexForRound(teamPairs, pvpIndices) {
	updatePVPIndexForRound(teamPairs, pvpIndices, -1);
}

function incrementPVPIndexForRound(teamPairs, pvpIndices) {
	updatePVPIndexForRound(teamPairs, pvpIndices, 1);
}

function findMaxPVP(teamPairs, pvpIndices) {
    let teamPairsCp = [...teamPairs];
    let maxPVP = 0;
    while(teamPairsCp.length > 0) {
        const [player1, player2] = teamPairsCp.shift();
        const [player3, player4] = teamPairsCp.shift();
        maxPVP = maxPVP + Math.pow(pvpIndices[player1][player3] - 2, 2) +
            Math.pow(pvpIndices[player1][player4] - 2, 2) +
            Math.pow(pvpIndices[player2][player3] - 2, 2) +
            Math.pow(pvpIndices[player2][player4] - 2, 2);
    }
    return maxPVP;
}

function findPVPVariance(pvpIndices) {
    return Object.keys(pvpIndices).reduce((variance, player) => {
        return variance + Object.keys(pvpIndices[player]).reduce((prVariance, player2) => {
            return prVariance + Math.pow(pvpIndices[player][player2] - 2, 2)
        }, 0)
    }, 0)
}

function calculatePossibleMatchups(teams) {
	let teamAnchor = teams.shift()
	let matches = []
	teams.forEach(team => {
		let anchorPair = [teamAnchor, team]
		let teamsSlice = teams.filter(t => t !== team)
        if(teamsSlice.length > 0) {
            calculatePossibleMatchups(teamsSlice).forEach(match => {
			    matches.push([...anchorPair, ...match])
		    })
        } else {
            matches.push(anchorPair)
        }
	})
	teams.unshift(teamAnchor)
	return matches
}