import { Coordinates } from "../classes/coordinates";
import { Piece } from "../classes/piece";

const boardRows = document.getElementsByClassName("board-row");

// very important function. Returns DOM index based on row and col indexes
export function getDOMPiece(rowIndex, colIndex) {
    // check if indexes are in the valid range
    if (rowIndex === null || colIndex === null || rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0) {
        return null;
    }
    return boardRows[rowIndex].children[colIndex].firstElementChild;
}

// converts normal pieces to actual DOM pieces
export function getDOMPiecesFromPieces(pieces) {
    let domPieces = [];
    for (let piece of pieces) {
        const [r, c] = piece.coordinates.toIndex();
        const domPiece = getDOMPiece(r, c);
        if (domPiece) {
            domPieces.push(domPiece);
        }
    }

    return domPieces;
}

export function getSymbolForPiece(piece) {
    const isWhite = piece.color === "white";
    const map = {
        pawn: "p",
        knight: "n",
        bishop: "b",
        rook: "r",
        queen: "q",
        king: "k"
    };
    let symbol = map[piece.type] || "s";
    let finalString = isWhite ? "W" : "B";
    return finalString + symbol;
}

// returns index of the column of the piece
export function getColumnsIndex(piece) {
    // lets find the column it is acutally on
    let currentRowColumns = piece.parentElement.parentElement.children;
    let currentColumnIndex = -1;

    for (let i = 0; i < currentRowColumns.length; i++) {
        if (currentRowColumns[i] == piece.parentElement) {
            return i;
        }
    }
    return currentColumnIndex;
}

export function getRowIndex(piece) {
    // lets find the index of the row it is actually on.
    let currentPieceRow = piece.parentElement.parentElement;
    let currentRowIndex = -1;
    for (let i = 0; i < boardRows.length; i++) {
        if (boardRows[i] == currentPieceRow) {
            return i;
        }
    }

    return currentRowIndex;
}

/**
 * Opposite to getDomPiece, this function takes domPiece and returns indexes of normal piece
 * @param {*} domPiece provided domPiece
 * @returns indexes
 */
export function getPieceFromDOMPiece(domPiece, game){
    const rowIndex = getRowIndex(domPiece);
    const colIndex = getColumnsIndex(domPiece);
    const classes = domPiece.className.split(" ");
    const color = classes[0];
    const pieceType = classes[2];

    if (rowIndex === null || colIndex === null || rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0) {
        return null;
    }

    for (let piece of game.pieces){
        const [pieceRow, pieceCol] = piece.coordinates.toIndex();
        if (pieceRow === rowIndex && pieceCol === colIndex) return piece;
    }

    return null; 
}