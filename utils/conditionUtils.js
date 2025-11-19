import * as MoveUtils from "./moveUtils.js";
import * as PieceUtils from "./getPiecesUtils.js";
import * as DomUtils from "./domUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";
import * as Globals from "../classes/globals.js";

export function pieceIsPinned(piece, game) {
    const isWhite = piece.color === "white";
    const sameColor = isWhite ? "white" : "black";
    const king = PieceUtils.getPieces({ color: sameColor, type: "king" }, game)[0]; // 1 item array
    let possibleMovesDuringPin = [];
    // based on indexes, calculate direction from king to piece
    const [kingRow, kingCol] = king.coordinates.toIndex();
    const [pieceRow, pieceCol] = piece.coordinates.toIndex();
    const rowsDifference = kingRow - pieceRow;
    const colsDifference = kingCol - pieceCol;

    let direction;
    if (rowsDifference > 0 && colsDifference > 0) {
        direction = isWhite ? "top-left" : "bottom-right";
    } else if (rowsDifference > 0 && colsDifference === 0) {
        direction = isWhite ? "front" : "back";
    } else if (rowsDifference > 0 && colsDifference < 0) {
        direction = isWhite ? "top-right" : "bottom-left";
    } else if (rowsDifference === 0 && colsDifference > 0) {
        direction = isWhite ? "left" : "right";
    } else if (rowsDifference === 0 && colsDifference < 0) {
        direction = isWhite ? "right" : "left";
    } else if (rowsDifference < 0 && colsDifference > 0) {
        direction = isWhite ? "bottom-left" : "top-right";
    } else if (rowsDifference < 0 && colsDifference === 0) {
        direction = isWhite ? "back" : "front";
    } else if (rowsDifference < 0 && colsDifference < 0) {
        direction = isWhite ? "bottom-right" : "top-left";
    }

    // in this array we will store piece types which can pin the piece in given direction
    let possiblePieceTypes = [];
    if (["front", "back", "left", "right"].includes(direction)) {
        possiblePieceTypes.push("q");
        possiblePieceTypes.push("r");
    } else if (["top-left", "top-right", "bottom-left", "bottom-right"].includes(direction)) {
        possiblePieceTypes.push("q");
        possiblePieceTypes.push("b");
    }

    // remove the piece on the board temporarily
    const pieceSymbol = game.chessBoard[pieceRow][pieceCol];
    game.chessBoard[pieceRow][pieceCol] = "s";// change it to empty square

    // get king long range moves in given direction -> we will check which opposite piece is at the end, if there is one
    const kingMovesInDirection = MoveUtils.getLongRangeMoves([kingRow, kingCol], isWhite, direction, game);
    if (kingMovesInDirection == null || kingMovesInDirection.length === 0) {
        // do not forget to add the piece back to board!
        game.chessBoard[pieceRow][pieceCol] = pieceSymbol;

        return null;
    }

    const lastItemIndexes = kingMovesInDirection.at(-1);
    const lastItemSymbol = game.chessBoard[lastItemIndexes[0]][lastItemIndexes[1]];
    const oppositeColorSymbol = isWhite ? "B" : "W";
    if (!(lastItemSymbol.includes(oppositeColorSymbol))) {// if there is no piece looking through the piece on king
        // we know we are not pinned, return null

        // do not forget to add the piece back to board!
        game.chessBoard[pieceRow][pieceCol] = pieceSymbol;

        return null;
    }

    // otherwise check if the piece is the one which can attack in given direction
    // the string is for example "Wb", how to get the last symbol of the string. 
    if (lastItemSymbol.includes(oppositeColorSymbol) && possiblePieceTypes.includes(lastItemSymbol[lastItemSymbol.length - 1])) {
        possibleMovesDuringPin.push(...kingMovesInDirection);
        possibleMovesDuringPin = possibleMovesDuringPin.filter(item => !(item[0] === pieceRow && item[1] === pieceCol));

        // do not forget to add the piece back to board!
        game.chessBoard[pieceRow][pieceCol] = pieceSymbol;

        return possibleMovesDuringPin;
    }

    // do not forget to add the piece back to board!
    game.chessBoard[pieceRow][pieceCol] = pieceSymbol;
    return null;
}

/**
 * This function answers this question: is given square on 'indexes' attacked by any piece of given 'attackerColor'?
 * @param {*} indexes indexes of the square we are asking about
 * @param {*} isWhite the color of attackers, if yes, attacker is white, if false, attacker is black
 */
export function isAttacked(indexes, isWhite, game) {
    const attackerColor = isWhite ? "white" : "black";
    // first get pieces of attackerColor
    const attackerPieces = PieceUtils.getPieces({ color: attackerColor }, game);

    // go through each piece
    for (let piece of attackerPieces) {
        // get its legal moves
        const pieceAttackingMoves = MoveUtils.getAttackingMoves(piece, game);
        console.log("checking this piece: " + piece);
        console.log("its attacking moves are: " + pieceAttackingMoves);
        if (MoveUtils.containsIndex(indexes, pieceAttackingMoves)){
            return true;
        }
    }

    return false;
}

export function isAttackedWithoutKing(index, isWhite, game){
    // first remove the king from the Chess Board
    const oppositeColor = isWhite ? "black" : "white";
    const oponentKing = PieceUtils.getPieces({color: oppositeColor, type: "king"}, game)[0];
    const [kRow, kCol] = oponentKing.coordinates.toIndex();
    const kingSymbol = game.chessBoard[kRow][kCol];
    game.chessBoard[kRow][kCol] = "s";
    // call normal function
    console.log("checking this index: " + index);
    const isAttBool = isAttacked(index, isWhite, game);
    // return king to board
    game.chessBoard[kRow][kCol] = kingSymbol;
    return isAttBool;
}

export function isDefended(indexes, isWhite, game) {
    const color = isWhite ? "white" : "black";
    // first get friendly pieces
    const friendlyPieces = PieceUtils.getPieces({ color: color }, game);

    for (let piece of friendlyPieces) {
        const pieceDefendingMoves = MoveUtils.getDefendingMoves(piece, game);
        if (MoveUtils.containsIndex(indexes, pieceDefendingMoves)){
            return true;
        }
    }

    return false;
}

export function castlesIsPossible(king, rook) {
    return !(king.hasMoved) && !(rook.hasMoved);
}

export function thisIsPawnSpecialMove(piece, legalMove, game) {
    const isWhite = piece.color === "white";

    // first check if the piece is pawn
    if (!(piece.type === "pawn")) {//if not
        return false;
    }

    // then check if the pawn is on initial position
    if (piece.hasMoved) {
        return false;
    }

    // lastly, check if the legal move is the '2nd front element'.
    const front = MoveUtils.getIndexesInDirection(piece, "front");
    const doubleFront = MoveUtils.getIndexesInDirectionFromSquare(front, isWhite, "front");
    if (doubleFront === null){
        console.error("Could not get double fron indexes. Maybe front are bad? " + front);
        return;
    }
    const domElement = DomUtils.getDOMElementFromIndex(doubleFront);

    if (domElement !== legalMove) {
        return false;
    }

    return true;
}

export function thisIsPawnPromotionMove(piece, legalMove) {
    const isWhite = piece.color === "white";
    const lastRowsIndex = isWhite ? 0 : 7;

    if (piece.type === "pawn" && DomUtils.getRowIndex(legalMove) === lastRowsIndex) {
        return true;
    }

    return false;
}

export function thisIsEnPassantMove(piece, legalMove, game) {
    const isWhite = piece.color === "white";

    if (piece.type !== "pawn") {
        return false;
    }

    const [_, col] = piece.coordinates.toIndex();
    const colDifference = col - DomUtils.getColumnsIndex(legalMove);
    if (Math.abs(colDifference) !== 1) {// if there is no columns difference, or it is different than one, 
        return false;
    }

    let direction;
    if (colDifference > 0) {
        direction = isWhite ? "left" : "right";
    } else if (colDifference < 0) {
        direction = isWhite ? "right" : "left";
    }

    const indexesNextToPawn = MoveUtils.getIndexesInDirection(piece, direction);
    if (indexesNextToPawn === null) {
        return false;
    }
    const pieceNextToPawn = PieceUtils.getPieceFromIndexes(indexesNextToPawn, game);
    if (pieceNextToPawn === null) {
        return false;
    }

    if (pieceNextToPawn.hasDoubleJumped && pieceNextToPawn.hasDoubleJumpedNow) {
        return true;
    }

    return false;
}

export function thisIsCastleMove(piece, legalMove) {
    if (piece.type !== "king") {
        return false;
    }

    const [kRow, kCol] = piece.coordinates.toIndex();
    // else we gotta check if the move is 
    // a) on the same row
    // b) difference of the cols is two
    if (kRow !== DomUtils.getRowIndex(legalMove)) {
        return false;
    }

    const colDiff = Math.abs(kCol - (DomUtils.getColumnsIndex(legalMove)));
    if (colDiff !== 2) {
        return false;
    }

    return true;
}

export function isCheck(isWhite, game) {
    const nrOfCheckingPieces = PieceUtils.getCheckingPieces(isWhite, game);
    if (nrOfCheckingPieces.length > 0){
        return true;
    }

    return false;
}