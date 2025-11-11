import * as MoveUtils from "./moveUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";

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

/**
 * This function returns pieces based on attributes. If you enter color, it gets pieces based on color, if you enter
 * piece type, it returns pieces based on type + combinations of both. 
 * @param {*} param0 - {color - white/black, type - pawn, knight, ...}
 * @param {*} game the game
 * @returns array of pieces based on attributes
 */
export function getPieces({ color = null, type = null } = {}, game) {
    return game.pieces.filter(piece => {
        return (!color || piece.color === color) && (!type || piece.type === type);
    });
}

// this function returns DOM elements representing the white pieces
export function getDOMPieces(game) {
    let actualColor = game.isWhitesTurn ? "white" : "black";
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
        let checkingPieces = getCheckingPieces(game);
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
        statusBarPar.textContent = actualColor + " to play";
        const actualPieces = getPieces({ color: actualColor }, game);
        for (let piece of actualPieces) {
            const pieceIndexes = piece.coordinates.toIndex();
            domPieces.push(PieceUtils.getDOMPiece(pieceIndexes[0], pieceIndexes[1]));
        }
    }

    return domPieces;
}

export function getCheckingPieces(game) {
    let checkingPieces = [];
    // color of the actual playing side
    const actualColor = game.isWhitesTurn ? "white" : "black";
    const oppositeColor = game.isWhitesTurn ? "black" : "white";
    // get the king
    const kingInCheck = getPieces({ color: actualColor, type: "king" }, game);//this is one item array

    // get possible attackers - opposite color pieces
    const oppositeColorPieces = getPieces({ color: oppositeColor }, game);
    let pieceAttackingMoves;
    for (let possibleChecker of oppositeColorPieces) {
        pieceAttackingMoves = getAttackingMoves(possibleChecker, game);

    }
}