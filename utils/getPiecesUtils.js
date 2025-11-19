import * as MoveUtils from "./moveUtils.js";
import * as DomUtils from "./domUtils.js";
import * as Ui from "./ui.js";
import * as GameUtils from "./gameUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";
import * as Globals from "../classes/globals.js";

const boardRows = document.getElementsByClassName("board-row");



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


/**
 * This function returns pieces based on attributes. If you enter color, it gets pieces based on color, if you enter
 * piece type, it returns pieces based on type + combinations of both. AND it does not return taken pieces!
 * @param {*} param0 - {color - white/black, type - pawn, knight, ...}
 * @param {*} game the game
 * @returns array of pieces based on attributes
 */
export function getPieces({ color = null, type = null } = {}, game) {
    return game.pieces.filter(piece => {
        return (!color || piece.color === color) && (!type || piece.type === type) && (!piece.wasTaken);
    });
}



/**
 * This function returns the pieces which are checking the oponents king
 * @param {*} isWhite the color of pieces which can give check
 * @param {*} game the game
 */
export function getCheckingPieces(isWhite, game) {
    let checkingPieces = [];
    const sameColor = isWhite ? "white" : "black"; // this color pieces can give check
    const oppositeColor = isWhite ? "black" : "white";
    const oponentsKing = getPieces({ color: oppositeColor, type: "king" }, game)[0];
    const friendlyPieces = getPieces({ color: sameColor }, game);
    let pieceAttackingMoves;
    for (const friendlyPiece of friendlyPieces) {
        pieceAttackingMoves = MoveUtils.getAttackingMoves(friendlyPiece, game) || [];
        console.log("checking this piece: " + friendlyPiece);
        console.log("its attacking moves are: " + pieceAttackingMoves);
        if (pieceAttackingMoves.some(m => oponentsKing.coordinates.equals(m))) {
            checkingPieces.push(friendlyPiece);
        }
    }
    console.log("The checking pieces are: " + checkingPieces);

    return checkingPieces;
}

export function getPieceFromIndexes(indexes, game) {
    return game.pieces.find(piece =>
        piece.coordinates.equals(indexes)
    ) || null;
}

export function getIndexesFromAllPieces(game) {
    let indexes = [];
    for (let piece of game.pieces) {
        if (!(piece.wasTaken)) {
            indexes.push(piece.coordinates.toIndex());
        }
    }

    return indexes;
}

export function getCheckBlockingPieces(game, checkingPieces) {
    const currentColor = Globals.isWhitesTurn ? "white" : "black";
    const kingInCheck = getPieces({ color: currentColor, type: "king" }, game)[0];


    if (checkingPieces.length !== 1) {
        return [];
    }

    if (checkingPieces[0].type === "knight") {
        return []; // there are no blockers in case of knight check;
    }
    const blockingPieces = [];
    const kingCheckerDiagonal = MoveUtils.getSquaresBetweenKingAndChecker(kingInCheck, checkingPieces[0], game);
    const friendlyPieces = getPieces({ color: currentColor }, game);

    for (const piece of friendlyPieces) {
        if (piece.type === "king") {
            continue;
        }

        const legalMoves = MoveUtils.getLegalMoves(piece, game);
        const intersection = kingCheckerDiagonal.some(i => MoveUtils.containsIndex(i, legalMoves));
        if (intersection) {
            blockingPieces.push(piece);
        }
    }

    return blockingPieces;
}

export function getCheckerTakingPieces(game, checkingPieces) {
    const currentColor = Globals.isWhitesTurn ? "white" : "black";
    const kingInCheck = getPieces({ color: currentColor, type: "king" }, game);


    if (checkingPieces.length !== 1) {
        return [];
    }

    const takingPieces = [];
    const friendlyPieces = getPieces({ color: currentColor }, game);

    for (const piece of friendlyPieces) {
        if (piece.type === "king") {
            continue;
        }

        const attackingMoves = MoveUtils.getAttackingMoves(piece, game);

        if (attackingMoves.includes(checkingPieces[0].coordinates.toIndex())) {
            takingPieces.push(piece);
        }
    }

    return takingPieces;

}