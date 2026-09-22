const boardElement = document.querySelector('#board');
const cells = [...document.querySelectorAll('.cell')];
const statusText = document.querySelector('#status-text');
const restartButton = document.querySelector('#restart-button');
const playerOneScoreElement = document.querySelector('#player-one-score');
const playerTwoScoreElement = document.querySelector('#player-two-score');
const drawScoreElement = document.querySelector('#draw-score');
const roundNumberElement = document.querySelector('#round-number');
const modeButtons = [...document.querySelectorAll('.mode-button')];
const playerOneLabelElement = document.querySelector('#player-one-label');
const playerTwoLabelElement = document.querySelector('#player-two-label');
const modeLabelElement = document.querySelector('#mode-label');
const playerChipLabelElement = document.querySelector('#player-chip-label');

const HUMAN = 'X';
const AI = 'O';
const WINNING_COMBINATIONS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let board = Array(9).fill('');
let gameOver = false;
let scores = { playerOne: 0, playerTwo: 0, draws: 0 };
let round = 1;
let aiTimer;
let roundToken = 0;
let currentPlayer = HUMAN;
let selectedMode = 'ai';

function getWinner(currentBoard) {
	for (const combination of WINNING_COMBINATIONS) {
		const [first, second, third] = combination;
		if (currentBoard[first] && currentBoard[first] === currentBoard[second] && currentBoard[first] === currentBoard[third]) return { symbol: currentBoard[first], combination };
	}
	return null;
}

function isDraw(currentBoard) { return currentBoard.every(Boolean); }

function updateScoreboard() {
	playerOneScoreElement.textContent = scores.playerOne;
	playerTwoScoreElement.textContent = scores.playerTwo;
	drawScoreElement.textContent = scores.draws;
}

function renderBoard() {
	cells.forEach((cell, index) => {
		const value = board[index];
		cell.textContent = value;
		cell.className = `cell${value ? ` ${value.toLowerCase()}` : ''}`;
		cell.disabled = Boolean(value) || gameOver || (selectedMode === 'ai' && currentPlayer === AI && !gameOver);
		cell.setAttribute('aria-label', value ? `Cell ${index + 1}: ${value}` : `Empty cell ${index + 1}`);
	});
}

function setStatus(message, symbol = '') { statusText.innerHTML = `${message}${symbol ? ` <span class="turn-symbol">${symbol}</span>` : ''}`; }

function updateModeLabels() {
	const isAiMode = selectedMode === 'ai';
	modeLabelElement.innerHTML = isAiMode ? 'HUMAN VS AI <span class="status-dot" aria-hidden="true"></span>' : 'PLAYER VS PLAYER <span class="status-dot" aria-hidden="true"></span>';
	playerOneLabelElement.textContent = isAiMode ? 'YOU' : 'PLAYER 1';
	playerTwoLabelElement.textContent = isAiMode ? 'AI' : 'PLAYER 2';
	playerChipLabelElement.textContent = isAiMode ? 'You play first' : 'Player X starts';
	modeButtons.forEach(button => {
		button.classList.toggle('active', button.dataset.mode === selectedMode);
	});
}

function updateTurnStatus() {
	if (gameOver) return;
	if (selectedMode === 'ai') {
		if (currentPlayer === HUMAN) { setStatus('Your turn', HUMAN); }
		else { setStatus('AI is thinking'); }
		return;
	}
	setStatus(currentPlayer === HUMAN ? 'Player X turn' : 'Player O turn', currentPlayer);
}

function finishGame(result) {
	gameOver = true;
	if (result && result.symbol === HUMAN) {
		if (selectedMode === 'ai') { scores.playerOne += 1; setStatus('You win'); }
		else { scores.playerOne += 1; setStatus('Player X wins'); }
	} else if (result && result.symbol === AI) {
		if (selectedMode === 'ai') { scores.playerTwo += 1; setStatus('AI wins'); }
		else { scores.playerTwo += 1; setStatus('Player O wins'); }
	} else {
		scores.draws += 1; setStatus('It is a draw');
	}
	if (result) result.combination.forEach(index => cells[index].classList.add('winner'));
	updateScoreboard();
	cells.forEach(cell => { cell.disabled = true; });
}

function evaluate(currentBoard) {
	const winner = getWinner(currentBoard);
	if (winner) return winner.symbol === AI ? 10 : -10;
	if (isDraw(currentBoard)) return 0;
	return null;
}

function minimax(currentBoard, depth, maximizing) {
	const result = evaluate(currentBoard);
	if (result !== null) return result === 0 ? 0 : result - (maximizing ? depth : -depth);
	if (maximizing) {
		let bestScore = -Infinity;
		currentBoard.forEach((cell, index) => { if (!cell) { currentBoard[index] = AI; bestScore = Math.max(bestScore, minimax(currentBoard, depth + 1, false)); currentBoard[index] = ''; } });
		return bestScore;
	}
	let bestScore = Infinity;
	currentBoard.forEach((cell, index) => { if (!cell) { currentBoard[index] = HUMAN; bestScore = Math.min(bestScore, minimax(currentBoard, depth + 1, true)); currentBoard[index] = ''; } });
	return bestScore;
}

function getBestMove() {
	let bestScore = -Infinity;
	let move;
	board.forEach((cell, index) => {
		if (!cell) {
			board[index] = AI;
			const score = minimax(board, 0, false);
			board[index] = '';
			if (score > bestScore) { bestScore = score; move = index; }
		}
	});
	return move;
}

function playMove(index, symbol) {
	board[index] = symbol;
	renderBoard();
	const winner = getWinner(board);
	if (winner || isDraw(board)) finishGame(winner);
	return !gameOver;
}

function triggerAiTurn() {
	if (selectedMode !== 'ai' || currentPlayer !== AI || gameOver) return;
	boardElement.setAttribute('aria-busy', 'true');
	cells.forEach(cell => { cell.disabled = true; });
	const currentRoundToken = roundToken;
	aiTimer = window.setTimeout(() => {
		if (currentRoundToken !== roundToken || gameOver) return;
		const move = getBestMove();
		if (move === undefined) return;
		playMove(move, AI);
		boardElement.removeAttribute('aria-busy');
		if (!gameOver) {
			currentPlayer = HUMAN;
			renderBoard();
			updateTurnStatus();
		}
	}, 420);
}

function handleHumanMove(event) {
	const index = Number(event.currentTarget.dataset.index);
	if (gameOver || board[index]) return;
	if (selectedMode === 'ai' && currentPlayer === AI) return;

	const outcome = playMove(index, currentPlayer);
	if (!outcome) return;

	if (selectedMode === 'ai' && currentPlayer === HUMAN) {
		currentPlayer = AI;
		updateTurnStatus();
		triggerAiTurn();
		return;
	}

	if (selectedMode === 'pvp') {
		currentPlayer = currentPlayer === HUMAN ? AI : HUMAN;
		updateTurnStatus();
	}
}

function switchMode(mode) {
	selectedMode = mode;
	window.clearTimeout(aiTimer);
	roundToken += 1;
	board = Array(9).fill('');
	gameOver = false;
	currentPlayer = HUMAN;
	renderBoard();
	updateModeLabels();
	updateTurnStatus();
}

function restartGame() {
	window.clearTimeout(aiTimer);
	roundToken += 1;
	board = Array(9).fill('');
	gameOver = false;
	currentPlayer = HUMAN;
	round += 1;
	roundNumberElement.textContent = String(round).padStart(2, '0');
	renderBoard();
	updateTurnStatus();
}

cells.forEach(cell => cell.addEventListener('click', handleHumanMove));
restartButton.addEventListener('click', restartGame);
modeButtons.forEach(button => {
	button.addEventListener('click', () => switchMode(button.dataset.mode));
});
updateModeLabels();
updateScoreboard();
renderBoard();
updateTurnStatus();
