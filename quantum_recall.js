document.addEventListener('DOMContentLoaded', () => {
    const gridSizeInput = document.getElementById('gridSize');
    const numPlayersInput = document.getElementById('numPlayers');
    const startGameButton = document.getElementById('startGameButton');
    const gameSetupPanel = document.querySelector('.game-setup-panel');
    const gameArea = document.querySelector('.game-area');
    const gridContainer = document.getElementById('gridContainer');
    const currentPlayerDisplay = document.getElementById('currentPlayerDisplay');
    const scoresDisplay = document.getElementById('scoresDisplay');
    const resultsPanel = document.querySelector('.results-panel');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const finalScores = document.getElementById('finalScores');
    const playAgainButton = document.getElementById('playAgainButton');
    const intuitionStats = document.getElementById('intuitionStats');

    // Real-time Intuition Panel Elements
    const rtTargetValueEl = document.getElementById('rtTargetValue');
    const rtUnseenOptionsEl = document.getElementById('rtUnseenOptions');
    const rtChanceOfMatchEl = document.getElementById('rtChanceOfMatch');
    const rtLastAttemptResultEl = document.getElementById('rtLastAttemptResult');

    let gameSettings = {
        rows: 0,
        cols: 0,
        numPlayers: 1,
        cards: [],
        cardValues: [],
        currentPlayer: 0,
        scores: [],
        flippedCards: [],
        matchedPairs: 0,
        totalPairs: 0,
        gameActive: false,
        seenCardIds: new Set(),
        playerIntuitivePlays: []
    };

    startGameButton.addEventListener('click', initializeGame);
    playAgainButton.addEventListener('click', () => {
        resultsPanel.style.display = 'none';
        gameSetupPanel.style.display = 'block';
        gameArea.style.display = 'none'; 
    });

    function parseGridSize(sizeStr) {
        const parts = sizeStr.toLowerCase().split('x');
        if (parts.length === 2) {
            const rows = parseInt(parts[0]);
            const cols = parseInt(parts[1]);
            if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0 && (rows * cols) % 2 === 0 && (rows * cols) <= 100) {
                return { rows, cols };
            }
        }
        alert('Invalid grid size. Use format RxC (e.g., 4x4). Total cells must be even and <= 100.');
        return null;
    }

    function initializeGame() {
        const gridSize = parseGridSize(gridSizeInput.value);
        if (!gridSize) return;

        gameSettings.rows = gridSize.rows;
        gameSettings.cols = gridSize.cols;
        gameSettings.numPlayers = parseInt(numPlayersInput.value);
        if (isNaN(gameSettings.numPlayers) || gameSettings.numPlayers < 1 || gameSettings.numPlayers > 4) {
            alert('Number of players must be between 1 and 4.');
            return;
        }

        gameSettings.totalPairs = (gameSettings.rows * gameSettings.cols) / 2;
        gameSettings.scores = Array(gameSettings.numPlayers).fill(0);
        gameSettings.currentPlayer = 0;
        gameSettings.matchedPairs = 0;
        gameSettings.flippedCards = [];
        gameSettings.gameActive = true;
        gameSettings.seenCardIds.clear();
        gameSettings.playerIntuitivePlays = Array(gameSettings.numPlayers).fill(null).map(() => []);

        // Reset real-time panel
        rtTargetValueEl.textContent = 'Target Value: -';
        rtUnseenOptionsEl.textContent = 'Unseen Options: -';
        rtChanceOfMatchEl.textContent = 'Chance of Intuitive Match: -';
        rtLastAttemptResultEl.textContent = 'Last Attempt: -';

        generateCardValues();
        shuffleCards();
        createGrid();
        updateUIDisplay();

        gameSetupPanel.style.display = 'none';
        resultsPanel.style.display = 'none';
        gameArea.style.display = 'block';
    }

    function generateCardValues() {
        gameSettings.cardValues = [];
        for (let i = 1; i <= gameSettings.totalPairs; i++) {
            gameSettings.cardValues.push(i, i); // Add pairs of numbers
        }
    }

    function shuffleCards() {
        // Fisher-Yates shuffle
        for (let i = gameSettings.cardValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameSettings.cardValues[i], gameSettings.cardValues[j]] = [gameSettings.cardValues[j], gameSettings.cardValues[i]];
        }
    }

    function createGrid() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${gameSettings.cols}, auto)`;
        gameSettings.cards = [];

        for (let i = 0; i < gameSettings.rows * gameSettings.cols; i++) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.id = i;
            card.dataset.value = gameSettings.cardValues[i];
            
            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');
            cardContent.textContent = gameSettings.cardValues[i];
            card.appendChild(cardContent);

            card.addEventListener('click', handleCardClick);
            gridContainer.appendChild(card);
            gameSettings.cards.push(card);
        }
    }

    function getUnseenCardCount(excludeCard1Id = null, excludeCard2Id = null) {
        let count = 0;
        gameSettings.cards.forEach(cardEl => {
            if (!cardEl.classList.contains('matched') && !gameSettings.seenCardIds.has(cardEl.dataset.id)) {
                if ( (excludeCard1Id && cardEl.dataset.id === excludeCard1Id) || 
                     (excludeCard2Id && cardEl.dataset.id === excludeCard2Id) ) {
                    // Don't count the card(s) just flipped if they were also unseen before this turn segment
                } else {
                    count++;
                }
            }
        });
        return count;
    }

    function updateRealtimeIntuitionPanelOnFirstPick(firstCard) {
        const firstCardValue = firstCard.dataset.value;
        rtTargetValueEl.textContent = `Target Value: ${firstCardValue}`;

        // Calculate unseen options *excluding* the first card IF it was also unseen before this pick.
        // For this calculation, consider firstCard as now 'conditionally seen' for the purpose of finding its pair.
        let unseenOptions = 0;
        gameSettings.cards.forEach(cardEl => {
            if (cardEl.dataset.id !== firstCard.dataset.id && 
                !cardEl.classList.contains('matched') && 
                !gameSettings.seenCardIds.has(cardEl.dataset.id)) {
                unseenOptions++;
            }
        });

        rtUnseenOptionsEl.textContent = `Unseen Options (for a pair): ${unseenOptions}`;
        if (unseenOptions > 0) {
            rtChanceOfMatchEl.textContent = `Chance of Intuitive Match (next pick): 1 in ${unseenOptions}`;
        } else {
            rtChanceOfMatchEl.textContent = 'Chance of Intuitive Match: (All other cards seen or matched)';
        }
        rtLastAttemptResultEl.textContent = 'Last Attempt: Waiting for second pick...';
        rtLastAttemptResultEl.style.color = 'var(--light)'; // Reset color
    }

    function updateRealtimeIntuitionPanelOnSecondPick(resultType, odds = 0) {
        // rtTargetValueEl, rtUnseenOptionsEl, rtChanceOfMatchEl are set by the first pick update.
        let message = 'Last Attempt: ';
        let color = 'var(--light)';

        switch (resultType) {
            case 'INTUITIVE_HIT':
                message += `INTUITIVE HIT! Found match against 1 in ${odds} odds.`;
                color = 'var(--success)';
                break;
            case 'MEMORY_MATCH':
                message += 'MATCH! (From memory)';
                color = 'var(--primary)';
                break;
            case 'INTUITIVE_MISS':
                message += `MISS! (Intuitive attempt, odds were 1 in ${odds})`;
                color = 'var(--fail)';
                break;
            case 'MEMORY_MISS':
                message += 'MISS! (Memory attempt)';
                color = 'var(--fail)';
                break;
            default:
                message += '-';
        }
        rtLastAttemptResultEl.textContent = message;
        rtLastAttemptResultEl.style.color = color;
    }

    function handleCardClick(event) {
        if (!gameSettings.gameActive) return;

        const clickedCard = event.currentTarget;
        const clickedCardId = clickedCard.dataset.id;

        if (clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) {
            return; 
        }

        if (gameSettings.flippedCards.length === 0) {
            // First card pick of a turn/attempt
            const cardWasAlreadySeen = gameSettings.seenCardIds.has(clickedCardId);
            clickedCard.dataset.wasSeen = cardWasAlreadySeen;
            flipCard(clickedCard);
            gameSettings.flippedCards.push(clickedCard);
            updateRealtimeIntuitionPanelOnFirstPick(clickedCard);
        } else if (gameSettings.flippedCards.length === 1) {
            // Second card pick
            if (clickedCard === gameSettings.flippedCards[0]) return; // Clicked the same card again

            const cardWasAlreadySeen = gameSettings.seenCardIds.has(clickedCardId);
            clickedCard.dataset.wasSeen = cardWasAlreadySeen;
            flipCard(clickedCard);
            gameSettings.flippedCards.push(clickedCard);
            setTimeout(checkForMatch, 1000);
        }
    }

    function flipCard(card) {
        card.classList.add('flipped');
        // Add to seenCardIds AFTER it's flipped and processed for intuition check
        // This will be handled in checkForMatch or after the turn resolves
    }

    function unflipCards(card1, card2) {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        // Add to seenCardIds as they were revealed
        gameSettings.seenCardIds.add(card1.dataset.id);
        gameSettings.seenCardIds.add(card2.dataset.id);
    }

    function checkForMatch() {
        if (gameSettings.flippedCards.length !== 2) return;

        const [card1, card2] = gameSettings.flippedCards;
        const card1Id = card1.dataset.id;
        const card2Id = card2.dataset.id;
        const card1Value = card1.dataset.value;
        const card2Value = card2.dataset.value;
        
        const card1OriginalSeenState = card1.dataset.wasSeen === 'true'; // This was its state *before this turn segment began*
        const card2OriginalSeenState = card2.dataset.wasSeen === 'true'; // This was its state *before this specific pick*

        recordPlayerAction(gameSettings.currentPlayer, card1Id, card2Id, card1Value === card2Value);

        let currentOdds = 0;
        let unseenOptionsForPair = 0;
        gameSettings.cards.forEach(cardEl => {
            if (cardEl.dataset.id !== card1Id && 
                !cardEl.classList.contains('matched') && 
                !gameSettings.seenCardIds.has(cardEl.dataset.id)) {
                unseenOptionsForPair++;
            }
        });
        currentOdds = unseenOptionsForPair > 0 ? unseenOptionsForPair : 0; // This is the 'Y' for 1 in Y
        // If card2 was already seen, currentOdds for an *intuitive* play are effectively 0 or not applicable.

        if (card1Value === card2Value) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            gameSettings.scores[gameSettings.currentPlayer]++;
            gameSettings.matchedPairs++;

            if (!card2OriginalSeenState) { // Intuitive Match
                if (currentOdds > 0) {
                    gameSettings.playerIntuitivePlays[gameSettings.currentPlayer].push(currentOdds);
                    updateRealtimeIntuitionPanelOnSecondPick('INTUITIVE_HIT', currentOdds);
                } else { // Should not happen if card2 was unseen and is a match, implies no other unseen cards
                    updateRealtimeIntuitionPanelOnSecondPick('INTUITIVE_HIT', 1); // Matched the only possible unseen card
                }
            } else { // Memory Match
                updateRealtimeIntuitionPanelOnSecondPick('MEMORY_MATCH');
            }

            gameSettings.seenCardIds.add(card1Id);
            gameSettings.seenCardIds.add(card2Id);

            if (gameSettings.matchedPairs === gameSettings.totalPairs) {
                endGame();
            } else {
                // Player continues, reset for next attempt
                gameSettings.flippedCards = []; 
                // Potentially clear parts of real-time panel or update for next pick by same player
                rtTargetValueEl.textContent = 'Target Value: Pick first card...';
                rtUnseenOptionsEl.textContent = 'Unseen Options: -';
                rtChanceOfMatchEl.textContent = 'Chance of Intuitive Match: -';
            }
        } else {
            // No match
            unflipCards(card1, card2); // Updates seenCardIds
            
            if (!card2OriginalSeenState) { // Intuitive Miss
                 updateRealtimeIntuitionPanelOnSecondPick('INTUITIVE_MISS', currentOdds > 0 ? currentOdds : 1);
            } else { // Memory Miss
                updateRealtimeIntuitionPanelOnSecondPick('MEMORY_MISS');
            }
            gameSettings.currentPlayer = (gameSettings.currentPlayer + 1) % gameSettings.numPlayers;
            // Reset for new player's turn
            rtTargetValueEl.textContent = 'Target Value: Pick first card...';
            rtUnseenOptionsEl.textContent = 'Unseen Options: -';
            rtChanceOfMatchEl.textContent = 'Chance of Intuitive Match: -';
        }

        // Only clear flippedCards if not continuing turn after a match
        if (!(card1Value === card2Value && gameSettings.matchedPairs !== gameSettings.totalPairs)) {
            gameSettings.flippedCards = [];
        }
        if (gameSettings.gameActive) {
             updateUIDisplay();
        }
    }

    function updateUIDisplay() {
        currentPlayerDisplay.textContent = `Current Player: Player ${gameSettings.currentPlayer + 1}`;
        let scoresText = 'Scores: ';
        for (let i = 0; i < gameSettings.numPlayers; i++) {
            scoresText += `Player ${i + 1}: ${gameSettings.scores[i]}  `;
        }
        scoresDisplay.textContent = scoresText.trim();
    }

    function endGame() {
        gameSettings.gameActive = false;
        gameArea.style.display = 'none';
        resultsPanel.style.display = 'block';

        let maxScore = -1;
        let winners = [];
        gameSettings.scores.forEach((score, index) => {
            if (score > maxScore) {
                maxScore = score;
                winners = [index + 1];
            } else if (score === maxScore) {
                winners.push(index + 1);
            }
        });

        if (winners.length > 1) {
            winnerDisplay.textContent = `It's a tie between Players: ${winners.join(', ')}!`;
        } else {
            winnerDisplay.textContent = `Player ${winners[0]} Wins!`;
        }

        finalScores.innerHTML = '';
        gameSettings.scores.forEach((score, index) => {
            const scoreP = document.createElement('div');
            scoreP.textContent = `Player ${index + 1}: ${score}`;
            finalScores.appendChild(scoreP);
        });

        // Display Intuition Stats
        intuitionStats.innerHTML = '';
        for (let i = 0; i < gameSettings.numPlayers; i++) {
            const intuitivePlaysForPlayer = gameSettings.playerIntuitivePlays[i];
            let mostIntuitivePlayValue = 0;
            if (intuitivePlaysForPlayer && intuitivePlaysForPlayer.length > 0) {
                mostIntuitivePlayValue = Math.max(...intuitivePlaysForPlayer);
            }

            const statP = document.createElement('div');
            statP.style.marginBottom = '0.5rem';

            if (mostIntuitivePlayValue > 0) {
                const mainStatText = `Player ${i + 1}'s Top Intuitive Play: Found a match against 1 in ${mostIntuitivePlayValue} odds!`;
                const explanationText = `(This means they correctly picked the matching card when there were ${mostIntuitivePlayValue -1} other unknown, previously unseen cards it could have been.)`;
                
                statP.innerHTML = `${mainStatText}<br><small style="opacity: 0.8;">${explanationText}</small>`;
            } else {
                statP.textContent = `Player ${i + 1}: No intuitive matches recorded this game.`;
            }
            intuitionStats.appendChild(statP);
        }
    }

    function recordPlayerAction(playerId, card1Id, card2Id, isMatch) {
        // Expanded logging for intuition
        const card2Element = gameSettings.cards.find(c => c.dataset.id === card2Id);
        const card2WasSeen = card2Element ? card2Element.dataset.wasSeen === 'true' : 'unknown_element';
        console.log(`Player ${playerId + 1} picked card ${card1Id}, then ${card2Id}. Match: ${isMatch}. Card 2 previously seen: ${card2WasSeen}. Total seen cards: ${gameSettings.seenCardIds.size}`);
    }
}); 