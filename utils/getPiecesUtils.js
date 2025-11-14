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



/**
 * This function returns the pieces which are checking the oponents king
 * @param {*} isWhite the color of pieces which can give check
 * @param {*} game the game
 */
export function getCheckingPieces(isWhite, game) {
    let checkingPieces = [];
    const sameColor = isWhite ? "white" : "black";
    const oppositeColor = isWhite ? "black" : "white";
    const oponentsKing = getPieces({ color: oppositeColor, type: "king" }, game).item(0);
    const friendlyPieces = getPieces({ color: sameColor }, game);

    let pieceAttackingMoves;
    for (let friendlyPiece of friendlyPieces) {
        pieceAttackingMoves = MoveUtils.getAttackingMoves(friendlyPiece, game);
        if (pieceAttackingMoves.includes(oponentsKing)) {
            checkingPieces.push(friendlyPiece);
        }
    }

    return checkingPieces;
}

export function getPieceFromIndexes(indexes, game){
    for (let piece of game.pieces){
        const pIndexes = piece.coordinates.toIndex();
        if (pIndexes === indexes){
            return piece;
        }
    }

    return null;
}