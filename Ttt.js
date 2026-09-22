const boardElement = document.querySelector('#board');
const cells = [...document.querySelectorAll('.cell')];
const statusText = document.querySelector('#status-text');
const restartButton = document.querySelector('#restart-button');
const playerScoreElement = document.querySelector('#player-score');
const aiScoreElement = document.querySelector('#ai-score');
const drawScoreElement = document.querySelector('#draw-score');
const roundNumberElement = document.querySelector('#round-number');

const HUMAN = 'X';
const AI = 'O';
const WINNING_COMBINATIONS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let board = Array(9).fill('');
let gameOver = false;
let scores = { player: 0, ai: 0, draws: 0 };
let round = 1;
let aiTimer;
let roundToken = 0;

function getWinner(currentBoard) {
	for (const combination of WINNING_COMBINATIONS) {
		const [first, second, third] = combination;
		if (currentBoard[first] && currentBoard[first] === currentBoard[second] && currentBoard[first] === currentBoard[third]) return { symbol: currentBoard[first], combination };
	}
	return null;
}

function isDraw(currentBoard) { return currentBoard.every(Boolean); }

function renderBoard() {
	cells.forEach((cell, index) => {
		const value = board[index];
		cell.textContent = value;
		cell.className = `cell${value ? ` ${value.toLowerCase()}` : ''}`;
		cell.disabled = Boolean(value) || gameOver;
		cell.setAttribute('aria-label', value ? `Cell ${index + 1}: ${value}` : `Empty cell ${index + 1}`);
	});
}

function setStatus(message, symbol = '') { statusText.innerHTML = `${message}${symbol ? ` <span class="turn-symbol">${symbol}</span>` : ''}`; }

function finishGame(result) {
	gameOver = true;
	if (result && result.symbol === HUMAN) { scores.player += 1; setStatus('You win'); }
	else if (result && result.symbol === AI) { scores.ai += 1; setStatus('AI wins'); }
	else { scores.draws += 1; setStatus('It is a draw'); }
	if (result) result.combination.forEach(index => cells[index].classList.add('winner'));
	playerScoreElement.textContent = scores.player;
	aiScoreElement.textContent = scores.ai;
	drawScoreElement.textContent = scores.draws;
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

function handleHumanMove(event) {
	const index = Number(event.currentTarget.dataset.index);
	if (gameOver || board[index]) return;
	if (!playMove(index, HUMAN)) return;
	setStatus('AI is thinking');
	boardElement.setAttribute('aria-busy', 'true');
	cells.forEach(cell => { cell.disabled = true; });
	const currentRoundToken = roundToken;
	aiTimer = window.setTimeout(() => {
		if (currentRoundToken !== roundToken) return;
		const move = getBestMove();
		playMove(move, AI);
		boardElement.removeAttribute('aria-busy');
		if (!gameOver) { cells.forEach(cell => { cell.disabled = Boolean(board[Number(cell.dataset.index)]); }); setStatus('Your turn', HUMAN); }
	}, 420);
}

function restartGame() {
	window.clearTimeout(aiTimer);
	roundToken += 1;
	board = Array(9).fill('');
	gameOver = false;
	round += 1;
	roundNumberElement.textContent = String(round).padStart(2, '0');
	renderBoard();
	setStatus('Your turn', HUMAN);
}

cells.forEach(cell => cell.addEventListener('click', handleHumanMove));
restartButton.addEventListener('click', restartGame);
renderBoard();
