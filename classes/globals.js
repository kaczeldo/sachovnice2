// globals.js
export let domPiecesToPlay = [];
export let thereIsOnlyKingToPlayWith = false;
export let isWhitesTurn = true;
export let gameOver = false;
export let isWhiteInCheck = false;
export let isBlackInCheck = false;

// You can also export functions to modify them safely
export function resetGameFlags() {
  thereIsOnlyKingToPlayWith = false;
  isWhitesTurn = true;
  gameOver = false;
  isWhiteInCheck = false;
  isBlackInCheck = false;
}