const game = (function() {
    let players = [];
    let playersScore = [];
    let isGameActive = false;
    let currentPlayer = null;
    let diceNumber = null;

    const playersLimit = 4;
    const ladders = {4 : 24, 13: 46, 33 : 39, 42: 63, 50: 69, 62: 81, 74: 92};
    const snakes = {27: 5, 40: 3, 43: 18, 54: 31, 66: 35, 76: 58, 89: 53, 99: 41};
    const playerColors = ['red', 'green', 'blue', 'yellow'];

    const sounds = {
        diceRrolling : 'sounds/dice-rolling.mp3',
        success : 'sounds/game-win.mp3',
        click : 'sounds/click-sound.mp3',
        warning : 'sounds/game-warning.mp3',
        snakeHiss: 'sounds/snake-hiss.mp3',
        ladderStepUp: 'sounds/step-up.mp3',
        start: 'sounds/game-start.mp3',
    }

    function initSetup() {
        bindEvents();
        generateGameDashboard();
    }

    function bindEvents() {
        document.getElementById('add-player-button').addEventListener('click', addPlayerHandler);
        document.getElementById('roll-dice').addEventListener('click', rollDiceHandler);
        document.getElementById('start-game-button').addEventListener('click', startGameHandler);
    }

    function generateGameDashboard() {
        const gameDashboard = document.getElementById('game-dashboard');
        for(let i = 10; i > 0; i--) {
            let row = document.createElement('div');

            let start = 0;
            let end = 0;
            if (i % 2 === 0) {
                start = i * 10;
                end = start - 9;
                for(let j = start; j >= end; j--) {
                    row.appendChild(generateBox(j));
                }
            } else {
                end = i * 10;
                start = end - 9;

                for(let j = start; j <= end; j++) {
                    row.appendChild(generateBox(j));
                }
            }
            row.style.display = 'flex';
            gameDashboard.appendChild(row);
        }

        // Mark ladders target
        markSpecialBoxes(Object.values(ladders), 'green');

        // Mark snake bite target
        markSpecialBoxes(Object.values(snakes), 'red');
    }

    function markSpecialBoxes(boxes, color) {
        boxes.forEach(function(boxId) {
            let box = document.getElementById("box-" + boxId);
            box.style.backgroundColor = color;
            box.style.color = 'white';
            box.style.opacity = 0.5;
        });
    }

    function generateBox(value) {
        let box = document.createElement('div');
        box.id = 'box-' + value;
        box.classList.add('box');

        if (snakes[value] !== undefined) {
            box.style.backgroundImage = "url('./images/snake.jpg')";
            box.style.backgroundSize = 'cover';
        } else if (ladders[value] !== undefined) {
            box.style.backgroundImage = "url('./images/ladder.jpg')";
            box.style.backgroundSize = 'cover';
        } else {
            box.textContent = value;
        }
        return box;
    }

    function startGameHandler() {
        if (isGameActive === false && players.length > 0) {
            isGameActive = true;
            playSound('start');
            hideWinningMessage();
        } else {
            playSound('warning');
        }
    }

    function addPlayerHandler() {
        if (isGameActive === false && players.length < playersLimit) {
            let playerName = prompt('Please enter new player name.');
            if (playerName !== null) {
                addPlayerToPlayersList(playerName);
                drawPlayerSpawn(playerName);
            }
        } else {
            playSound('warning');
        }
    }

    function drawPlayerSpawn(playerName) {
        const spawnHeadingContainer = document.getElementById('players-spawns-heading');
        spawnHeadingContainer.style.display = 'inline';

        const playerSpawnConatiner = document.getElementById('players-spawns');
        let newSpawn = document.createElement('span');
        let playerIndex = players.length - 1;

        newSpawn.id = 'spawn-' + playerIndex;
        newSpawn.classList.add('spawn');
        newSpawn.style.backgroundColor = playerColors[players.length - 1];
        playerSpawnConatiner.appendChild(newSpawn);
    }

    function generateCurrentPlayerSpawnPosition() {
        let boxElement = document.getElementById('box-' + playersScore[currentPlayer]);
        let divLeftPosition = boxElement.offsetLeft;
        let divTopPosition = boxElement.offsetTop;

        let spawnElement = document.getElementById('spawn-' + currentPlayer);
        spawnElement.style.position = 'absolute';
        spawnElement.style.left = (divLeftPosition + getWindowSize()) + 'px';
        spawnElement.style.top = (divTopPosition + getWindowSize()) + 'px';
    }

    function addPlayerToPlayersList(playerName) {
        const olElementParent = document.querySelector('#palyers-list');
        const olElement = olElementParent.querySelector('ol');

        let liElements = olElement.querySelectorAll("li");
        if (players.length === 0 && liElements.length == 1) {
            liElements[0].remove();
        }

        players.push(playerName);
        playersScore.push(0);

        let newEmployee = document.createElement('li');
        newEmployee.textContent = playerName;
        newEmployee.classList.add('padding-5');
        
        if (players.length === 1) {
            currentPlayer = 0;
            newEmployee.classList.add('border');
        }

        olElement.appendChild(newEmployee);
    }

    // Roll Dice
    function rollDiceHandler() {
        const totalPlayers = players.length;
        if (isGameActive > 0) {
            // Generate a random number between 1 and 6
            diceNumber = getDiceNumber();
            document.getElementById('dice-image').src = './images/dice-six-faces-' + diceNumber + '.png';

            playSound('dice-roll');

            // Manage current player score
            managePlayersTurnAndScore();
        } else {
            playSound('warning');
        }
    }

    // Generate a random number between 1 and 6
    function getDiceNumber() {
        return Math.floor(Math.random() * 6) + 1;
    }

    // Manage current player turn and score
    function managePlayersTurnAndScore() {
        let isLadder = false;
        let isFirstSixForPlayer = false;

        // Players score will be updated only after users gets first 6 on dice
        if (playersScore[currentPlayer] === -1 || playersScore[currentPlayer] > 0 || diceNumber === 6) {

            // Check for first time when user gets six to open in game
            if (diceNumber === 6 && playersScore[currentPlayer] === 0) {
                isFirstSixForPlayer = true;
                playersScore[currentPlayer] = -1;
                playSound('success');
            }

            if (!isFirstSixForPlayer) {
                if (playersScore[currentPlayer] === -1) {
                    playersScore[currentPlayer] = diceNumber;
                } else {
                    playersScore[currentPlayer] += diceNumber;
                }
                // Check for ladder and update player state to new if ladder exists
                isLadder = checkForLadder();

                // Check for snake and update player state to new if snake exists
                checkForSnake();
                
                if (playersScore[currentPlayer] > 100) {
                    playersScore[currentPlayer] -= diceNumber;
                } else if (checkForWin()) {
                    // Check for player win on each player turn
                    playSound('success');
                    return false;
                } else {
                    generateCurrentPlayerSpawnPosition();
                }
            }
        }

        if (!isFirstSixForPlayer && !isLadder) {
            // Move turn to next player
            currentPlayer++;
        }
        
        if (currentPlayer >= players.length) {
            currentPlayer = 0;
        }

        highlightCurrentPalyer();
    }

    function checkForLadder() {
        let currentPlayerScore = playersScore[currentPlayer];
        if (ladders[currentPlayerScore] !== undefined) {
            playSound('ladder');
            playersScore[currentPlayer] = ladders[currentPlayerScore];
            return true;
        }
        return false;
    }

    function checkForSnake() {
        let currentPlayerScore = playersScore[currentPlayer];
        if (snakes[currentPlayerScore] !== undefined) {
            playSound('snake');
            playersScore[currentPlayer] = snakes[currentPlayerScore];
        }
    }

    function checkForWin() {
        if (playersScore[currentPlayer] === 100) {
            displayWinningMessage();
            resetGameSettings();
            return true;
        }
        return false;
    }

    function hideWinningMessage() {
        const gameWinnerHeading = document.getElementById('game-result-heading');
        gameWinnerHeading.style.display = 'none';
        
        const gameWinningMessage = document.getElementById('game-result');
        gameWinningMessage.textContent = '';
    }

    function displayWinningMessage() {
        const gameWinnerHeading = document.getElementById('game-result-heading');
        gameWinnerHeading.style.display = 'inline';
        
        const gameWinningMessage = document.getElementById('game-result');
        gameWinningMessage.textContent = 'Result : ' + players[currentPlayer] + ' has won the game!!!';
    }

    function resetGameSettings() {
        isGameActive = false;
        currentPlayer = 0;
        diceNumber = null;
        playersScore = playersScore.map((score, index) => {
            return 0;
        });
        
        for(let i = 0; i < players.length; i++) {
            let spawn = document.getElementById("spawn-" + i);
            spawn.style.removeProperty("position");
            spawn.style.removeProperty("left");
            spawn.style.removeProperty("top");
        }

        const spawnHeadingContainer = document.getElementById('players-spawns-heading');
        spawnHeadingContainer.style.display = 'inline';
    }

    // Highlight payer based on his/her turn
    function highlightCurrentPalyer() {
        const playersConatiner = document.getElementById('palyers-list');
        const playersList = playersConatiner.querySelectorAll('li');
        
        playersList.forEach(li => li.classList.remove('border'));

        playersList[currentPlayer].classList.add('border');
    }

    function getWindowSize() {
        let documentWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        if (documentWidth >= 1290) {
            return 13;
        } else if (documentWidth >= 1024 && documentWidth < 1290) {
            return 8;
        } else if (documentWidth >= 914 && documentWidth < 1204) {
            return 11;
        } else if (documentWidth >= 653 && documentWidth < 914) {
            return 6;
        } else {
            return 10;
        }
    }

    // Play sound on different cases
    function playSound(type) {
        let soundFile = sounds.click;
        if (type === 'dice-roll') {
            soundFile = sounds.diceRrolling;
        } else if (type === 'warning') {
            soundFile = sounds.warning;
        } else if (type === 'success') {
            soundFile = sounds.success;
        } else  if (type === 'snake'){
            soundFile = sounds.snakeHiss;
        } else if (type === 'ladder') {
            soundFile = sounds.ladderStepUp;
        } else if (type === 'start') {
            soundFile = sounds.start;
        }
        const audio = new Audio(soundFile);
        audio.play();
    }

    return {
        init: initSetup
    }    
})();

game.init();