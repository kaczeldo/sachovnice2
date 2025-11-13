// globals.js
export let domPiecesToPlay = [];
export let thereIsOnlyKingToPlayWith = false;
export let isWhitesTurn = true;
export let gameOver = false;
export let isWhiteInCheck = false;
export let isBlackInCheck = false;
export let isDoubleCheck = false;
export const boardRows = document.getElementsByClassName("board-row");

// You can also export functions to modify them safely
export function resetGameFlags() {
  thereIsOnlyKingToPlayWith = false;
  isWhitesTurn = true;
  gameOver = false;
  isWhiteInCheck = false;
  isBlackInCheck = false;
}

export function setDomPiecesToPlay(pieces){
  domPiecesToPlay = pieces;
}

export function setOnlyKingToPlay(isThereOnlyKingToPlayWith){
  thereIsOnlyKingToPlayWith = isThereOnlyKingToPlayWith;
}

export function setIsWhitesTurn(value){
  isWhitesTurn = value;
}

export function setGameOver(value){
  gameOver = value;
}

export function setIsWhiteInCheck(value){
  isWhiteInCheck = value;
}

export function setIsBlackInCheck(value){
  isBlackInCheck = value;
}

export function setIsDoubleCheck(value){
  isDoubleCheck = value;
}