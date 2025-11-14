import * as MoveUtils from "./moveUtils.js";
import * as PieceUtils from "./getPiecesUtils.js";
import * as Ui from "./ui.js";
import * as GameUtils from "./gameUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";
import * as Globals from "../classes/globals.js";

// very important function. Returns DOM index based on row and col indexes
export function getDOMPiece(rowIndex, colIndex) {
    // check if indexes are in the valid range
    if (rowIndex === null || colIndex === null || rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0) {
        return null;
    }
    return Globals.boardRows[rowIndex].children[colIndex].firstElementChild;
}

// converts normal pieces to actual DOM pieces
export function getDOMPiecesFromPieces(pieces) {
    let domPieces = [];
    for (let piece of pieces) {
        const domPiece = getDOMPieceFromPiece(piece);
        if (domPiece) {
            domPieces.push(domPiece);
        }
    }

    return domPieces;
}

export function getDOMPieceFromPiece(piece) {
    const [r, c] = piece.coordinates.toIndex();
    const domPiece = getDOMPiece(r, c);
    if (domPiece) {
        return domPiece;
    }

    return null;
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
    for (let i = 0; i < Globals.boardRows.length; i++) {
        if (Globals.boardRows[i] == currentPieceRow) {
            return i;
        }
    }

    return currentRowIndex;
}

/**
 * Opposite to getDomPiece, this function takes domPiece and returns indexes of normal piece
 * @param {*} domPiece provided domPiece
 * @returns the piece
 */
export function getPieceFromDOMPiece(domPiece, game) {
    const rowIndex = getRowIndex(domPiece);
    const colIndex = getColumnsIndex(domPiece);
    const classes = domPiece.className.split(" ");
    const color = classes[0];
    const pieceType = classes[2];

    if (rowIndex === null || colIndex === null || rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0) {
        return null;
    }

    for (let piece of game.pieces) {
        const [pieceRow, pieceCol] = piece.coordinates.toIndex();
        if (pieceRow === rowIndex && pieceCol === colIndex) return piece;
    }

    return null;
}

export function getPiecesFromDOMPieces(domPieces, game) {
    let newPieces = [];
    for (let domPiece of domPieces) {
        newPieces.push(getPieceFromDOMPiece(domPiece, game));
    }

    return newPieces;
}

// this function returns DOM elements representing the white pieces
export function getDOMPieces(game) {
    const isWhite = Globals.isWhitesTurn ? true : false;
    const sameColor = isWhite ? "white" : "black";
    let domPieces = [];
    if (game.isWhiteCheck || game.isBlackCheck) {
        statusBarPar.textContent = actualColor + " to play, " + actualColor + " is in CHECK!";
        // add only pieces which can play in check
        // add king - this is always true
        domPieces.push(...getPieces({ color: actualColor, type: "king" }, game));

        if (game.isDoubleCheck) {
            return domPieces;
        }

        // first find the pieces which are giving check
        let checkingPieces = getCheckingPieces(!(isWhite), game);
        // check if this is only one piece -> must be
        if (!(checkingPieces.length === 1)) {
            return null;
        }

        // now add pieces which can block the check
        let checkBlockingPieces = getCheckBlockingPieces(game, checkingPieces);
        if (checkBlockingPieces === null) {
            return null;
        } else {
            domPieces.push(...checkBlockingPieces);
        }

        let checkerTakingPieces = getCheckerTakingPieces(game, checkingPieces);
        if (checkerTakingPieces === null) {
            return null;
        } else {
            domPieces.push(...checkerTakingPieces);
        }

        // avoid duplicities
        domPieces = [...new Set(domPieces)];

    } else { // if it is not a check
        Ui.updateStatusBar(sameColor + " to play 1");
        const actualPieces = PieceUtils.getPieces({ color: sameColor }, game);
        for (let piece of actualPieces) {
            const pieceIndexes = piece.coordinates.toIndex();
            domPieces.push(getDOMPiece(pieceIndexes[0], pieceIndexes[1]));
        }
    }

    return domPieces;
}

export function getDOMElementsFromIndexes(indexes) {
    let domElements = [];
    for (let index of indexes) {
        domElements.push(Globals.boardRows[index[0]].children[index[1]].firstElementChild);
    }
    return domElements;
}

