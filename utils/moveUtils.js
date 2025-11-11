import * as PieceUtils from "./getPiecesUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";

/**
 * This function will check if given move is a legalMove - move to empty square or oponnents piece.
 * @param {*} legalMoves array of legal moves.
 * @param {*} directionFn function returning indexes in given direction, may be null
 * @param {*} game instance of Game class, handling top level organization stuff.
 * @param {*} oppositeColorSymbol symbol of opposite color piece, W in case of blacks turn and B in case of whites.
 * @returns nothing
 */
export function tryPushMove(legalMoves, directionFn, game, oppositeColorSymbol) {
    const indexes = directionFn();
    if (!indexes) return;

    const [r, c] = indexes;
    const symbol = game.chessBoard[r][c];

    if (symbol === "s" || symbol.includes(oppositeColorSymbol)) {
        legalMoves.push(indexes);
    }
}

// Same as function "tryPushMove" with one big difference -> it will push the move also if there is piece of the same color.
export function tryPushNeutralMove(theMoves, directionFn, game) {
    const indexes = directionFn();
    if (!indexes) return;

    const [r, c] = indexes;
    const symbol = game.chessBoard[r][c];

    if (symbol === "s" || symbol.includes("W") || symbol.includes("B")) {
        theMoves.push(indexes);
    }
}

// returns true if the chess board square is empty
export function isEmptySquare(game, [row, col]) {
    return game.chessBoard[row][col] === "s";
}

// returns true if on given indexes there is enemy piece
export function isEnemyPiece(game, [row, col], oppositeColorSymbol) {
    const symbol = game.chessBoard[row][col];
    return symbol.includes(oppositeColorSymbol);
}

// safe get Directoins function -> do not crashes the whole program
export function safeGetDirection(piece, directionFn) {
    try {
        return directionFn(piece);
    } catch {
        return null;
    }
}

/**
 * One of the core functions -> it generates the legal moves for each possible piece type.
 * @param {*} piece the piece for which we should find the legal moves
 * @param {*} game the game
 * @returns the legalMoves for given piece
 */
export function getLegalMoves(piece, game) {
    let legalMoves = [];

    switch (piece.type) {
        case "pawn":
            legalMoves = getLegalPawnMoves(piece, game);
            break;
        case "knight":
            legalMoves = getLegalKnightMoves(piece, game);
            break;
        case "bishop":
            legalMoves = getLegalBishopMoves(piece, game);
            break;
        case "rook":
            legalMoves = getLegalRookMoves(piece, game);
            break;
        case "queen":
            legalMoves = getLegalQueenMoves(piece, game);
            break;
        case "king":
            legalMoves = getLegalKingMoves(piece, game);
            break;
        default:
            console.error("Invalid piece type.");
            break;
    }

    return legalMoves;
}

function getLegalPawnMoves(piece, game) {
    let legalMoves = [];
    const isWhite = piece.color === "white";
    const oppositeColorSymbol = isWhite ? "B" : "W";
    const possiblePinnedMovesIndexes = ConditionUtils.pieceIsPinned(piece, game);
    let isPinned = false;
    if (possiblePinnedMovesIndexes !== null) {
        isPinned = true;
    }

    // check normal front move
    const front = safeGetDirection(piece, p => getIndexesInDirection(p, "front"));
    normalFront: {
        if (front == null) break normalFront;
        if (isEmptySquare(game, front)) {
            legalMoves.push(front);
        }

        doubleFront: {
            // check initial double move
            if (piece.hasMoved) break doubleFront;
            const doubleFrontEleIndexes = getIndexesInDirectionFromSquare(front, isWhite, "front");
            if (doubleFrontEleIndexes == null) break doubleFront;
            const [doubleFrontRow, doubleFrontCol] = doubleFrontEleIndexes;
            const doubleFrontSymbol = game.chessBoard[doubleFrontRow][doubleFrontCol];
            if (doubleFrontSymbol === "s") {
                legalMoves.push(doubleFrontEleIndexes);
            }
        }
    }

    // check diagonals
    tryPushMove(legalMoves, safeGetDirection(piece, p => getIndexesInDirection(p, "top-left")), game, oppositeColorSymbol);
    tryPushMove(legalMoves, safeGetDirection(piece, p => getIndexesInDirection(p, "top-right")), game, oppositeColorSymbol);


    // check en passant
    // get element on left
    const leftElementIndexes = getIndexesInDirection(piece, "left");
    enPassantLeft: {
        if (leftElementIndexes == null) break enPassantLeft;
        const [leftElementRow, leftElementCol] = leftElementIndexes;
        let leftElementSymbol = game.chessBoard[leftElementRow][leftElementCol];
        if (leftElementSymbol !== oppositeColorSymbol + "p") break enPassantLeft;

        const leftPiece = game.pieces.find(p =>
            p.coordinates.equals(new Coordinates(leftElementCol, leftElementRow))
        );

        // check if that piece just jumped
        if (leftPiece && leftPiece.hasDoubleJumped) {//if yes, we can add the field behind him to legal moves
            const enPassantTarget = getIndexesInDirection(piece, "top-left");
            if (enPassantTarget) legalMoves.push(enPassantTarget);
        }
    }

    // get element on right
    const rightElementIndexes = getIndexesInDirection(piece, "right");
    enPassantRight: {
        if (rightElementIndexes == null) break enPassantRight;
        const [rightElementRow, rightElementCol] = rightElementIndexes;

        let rightElementSymbol = game.chessBoard[rightElementRow][rightElementCol];
        if (rightElementSymbol !== oppositeColorSymbol + "p") break enPassantRight;

        const rightPiece = game.pieces.find(p =>
            p.coordinates.equals(new Coordinates(rightElementCol, rightElementRow))
        );

        // check if that piece just jumped
        if (rightPiece && rightPiece.hasDoubleJumped) {//if yes, we can add the field behind him to legal moves
            const enPassantTarget = getIndexesInDirection(piece, "top-right");
            if (enPassantTarget) legalMoves.push(enPassantTarget);
        }
    }

    if (isPinned) {
        let newLegalMoves = legalMoves.filter(
            legalMove => possiblePinnedMovesIndexes.includes(legalMove)
        );

        return newLegalMoves;
    }

    return legalMoves;
}

function getLegalKnightMoves(piece, game) {
    let isWhite = piece.color === "white";
    let oppositeColorSymbol = isWhite ? "B" : "W";

    const possiblePinnedMovesIndexes = pieceIsPinned(piece, game);
    if (possiblePinnedMovesIndexes !== null) {// knight cannot move if its pinned -> return empty array;
        return [];
    }

    const possibleMoves = getAllKnightMoves(piece);
    return possibleMoves.filter(([r, c]) =>
        r >= 0 && r < 8 &&
        c >= 0 && c < 8 &&
        (game.chessBoard[r][c] === "s" || game.chessBoard[r][c].includes(oppositeColorSymbol))
    );
}

function getAllKnightMoves(piece) {
    const [r, c] = piece.coordinates.toIndex();
    const deltas = [[-1, -2], [-2, -1], [-1, 2], [-2, 1], [1, -2], [2, -1], [1, 2], [2, 1]];
    return deltas.map(([dR, dC]) => [r + dR, c + dC]);
}

function getLegalBishopMoves(piece, game) {
    let legalMoves = [];
    const isWhite = piece.color === "white";
    // before we start checking normal moves, check if you are not pinned
    let possiblePinnedMovesIndexes = ConditionUtils.pieceIsPinned(bishop);
    let isThePiecePinned = false;
    if (possiblePinnedMovesIndexes !== null) {
        isThePiecePinned = true;
    }

    const pieceIndexes = piece.coordinates.toIndex();

    const topLeftDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "top-left", game);
    const topRightDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "top-right", game);
    const bottomLeftDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "bottom-left", game);
    const bottomRightDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "bottom-right", game);

    legalMoves.push(...topLeftDiagonalMoves);
    legalMoves.push(...topRightDiagonalMoves);
    legalMoves.push(...bottomLeftDiagonalMoves);
    legalMoves.push(...bottomRightDiagonalMoves);

    if (isThePiecePinned) {
        let newLegalMoves = legalMoves.filter(
            legalMove => possiblePinnedMovesIndexes.includes(legalMove)
        );

        return newLegalMoves;
    }

    return legalMoves;
}

function getLegalRookMoves(piece, game) {
    let legalMoves = [];
    const isWhite = piece.color === "white";
    // before we start checking normal moves, check if you are not pinned
    let possiblePinnedMovesIndexes = ConditionUtils.pieceIsPinned(piece);
    let isThePiecePinned = false;
    if (possiblePinnedMovesIndexes !== null) {
        isThePiecePinned = true;
    }

    const pieceIndexes = piece.coordinates.toIndex();

    const frontMoves = getLongRangeMoves(pieceIndexes, isWhite, "front", game);
    const backMoves = getLongRangeMoves(pieceIndexes, isWhite, "back", game);
    const leftMoves = getLongRangeMoves(pieceIndexes, isWhite, "left", game);
    const rightMoves = getLongRangeMoves(pieceIndexes, isWhite, "right", game);

    legalMoves.push(...frontMoves);
    legalMoves.push(...backMoves);
    legalMoves.push(...leftMoves);
    legalMoves.push(...rightMoves);

    if (isThePiecePinned) {
        let newLegalMoves = legalMoves.filter(
            legalMove => possiblePinnedMovesIndexes.includes(legalMove)
        );

        return newLegalMoves;
    }

    return legalMoves;
}

function getLegalQueenMoves(piece, game) {
    let legalMoves = [];
    const isWhite = piece.color === "white";
    // before we start checking normal moves, check if you are not pinned
    let possiblePinnedMovesIndexes = ConditionUtils.pieceIsPinned(piece);
    let isThePiecePinned = false;
    if (possiblePinnedMovesIndexes !== null) {
        isThePiecePinned = true;
    }

    const pieceIndexes = piece.coordinates.toIndex();

    const topLeftDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "top-left", game);
    const topRightDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "top-right", game);
    const bottomLeftDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "bottom-left", game);
    const bottomRightDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "bottom-right", game);
    const frontMoves = getLongRangeMoves(pieceIndexes, isWhite, "front", game);
    const backMoves = getLongRangeMoves(pieceIndexes, isWhite, "back", game);
    const leftMoves = getLongRangeMoves(pieceIndexes, isWhite, "left", game);
    const rightMoves = getLongRangeMoves(pieceIndexes, isWhite, "right", game);

    legalMoves.push(...topLeftDiagonalMoves);
    legalMoves.push(...topRightDiagonalMoves);
    legalMoves.push(...bottomLeftDiagonalMoves);
    legalMoves.push(...bottomRightDiagonalMoves);
    legalMoves.push(...frontMoves);
    legalMoves.push(...backMoves);
    legalMoves.push(...leftMoves);
    legalMoves.push(...rightMoves);

    if (isThePiecePinned) {
        let newLegalMoves = legalMoves.filter(
            legalMove => possiblePinnedMovesIndexes.includes(legalMove)
        );

        return newLegalMoves;
    }

    return legalMoves;
}

function getLegalKingMoves(piece, game) {
    let possibleMoves = [];
    const isWhite = piece.color == "white";
    const oppositeColor = isWhite ? "black" : "white";

    let directions = ["front", "top-right", "right", "bottom-right", "back", "bottom-left", "left", "top-left"];
    let nextElement;
    for (let direction of directions) {
        nextElement = getIndexesInDirection(piece, direction);

        if (nextElement === null) {
            // do nothing
        } else if (game.chessBoard[nextElement[0]][nextElement[1]] === "s" && !(ConditionUtils.isAttacked(nextElement, !(isWhite), game))) {
            possibleMoves.push(nextElement);
        } else if (nextElement.classList.contains(oppositeColor) && !(isDefended(nextElement, !(isWhite)))) {
            possibleMoves.push(nextElement);
        }
    }


}

export function getLongRangeMoves(currentIndexes, isWhite, direction, game) {
    let legalMoves = [];
    const oppositeColorSymbol = isWhite ? "B" : "W";

    const nextElementIndexes = getIndexesInDirectionFromSquare(currentIndexes, isWhite, direction);
    if (nextElementIndexes == null) {
        return legalMoves;
    }

    const nextElementSymbol = game.chessBoard[nextElementIndexes[0]][nextElementIndexes[1]];
    if (nextElementSymbol === "s") {
        legalMoves.push(nextElementIndexes);
        legalMoves.push(...getLongRangeMoves(nextElementIndexes, isWhite, direction, game));
    } else if (nextElementSymbol.includes(oppositeColorSymbol)) {
        legalMoves.push(nextElementIndexes);
    }

    return legalMoves;
}

export function getNeutralLongRangeMoves(currentIndexes, isWhite, direction, game) {
    let theMoves = [];

    const nextElementIndexes = getIndexesInDirectionFromSquare(currentIndexes, isWhite, direction);
    if (nextElementIndexes == null) {
        return theMoves;
    }

    const nextElementSymbol = game.chessBoard[nextElementIndexes[0]][nextElementIndexes[1]];
    if (nextElementSymbol === "s") {
        theMoves.push(nextElementIndexes);
        theMoves.push(...getNeutralLongRangeMoves(nextElementIndexes, isWhite, direction, game));
    } else if (nextElementSymbol.includes("W") || nextElementSymbol.includes("B")) {
        theMoves.push(nextElementIndexes);
    }

    return theMoves;
}

export function getAttackingMoves(possibleChecker, game) {
    let attackingMoves = [];
    switch (possibleChecker.type) {
        case "pawn":
            attackingMoves = getPawnAttackingMoves(possibleChecker, game);
            break;
        case "knight":
            attackingMoves = getLegalKnightMoves(possibleChecker, game);
            break;
        case "bishop":
            attackingMoves = getLegalBishopMoves(possibleChecker, game);
            break;
        case "rook":
            attackingMoves = getLegalRookMoves(possibleChecker, game);
            break;
        case "queen":
            attackingMoves = getLegalQueenMoves(possibleChecker, game);
            break;
        case "king":
            attackingMoves = getAttackingKingMoves(possibleChecker, game);
            break;
        default:
            console.error("invalid piece type");
            break;
    }

    return attackingMoves;
}

function getPawnAttackingMoves(piece, game) {
    let attackingMoves = [];
    const isWhite = piece.color === "white";
    const topLeftIndexes = getIndexesInDirection(piece, "top-left");
    const oppositeColorSymbol = isWhite ? "B" : "W";
    if (!(topLeftIndexes == null)) {
        const topLeftElement = game.chessBoard[topLeftIndexes[0]][topLeftIndexes[1]];
        if (topLeftElement === "s" || topLeftElement.includes(oppositeColorSymbol)) {
            attackingMoves.push(topLeftIndexes);
        }
    }

    const topRightIndexes = getIndexesInDirection(piece, "top-right");
    if (!(topRightIndexes == null)) {
        const topRightElement = game.chessBoard[topRightIndexes[0]][topRightIndexes[1]];
        if (topRightElement === "s" || topRightElement.includes(oppositeColorSymbol)) {
            attackingMoves.push(topRightIndexes);
        }
    }

    return attackingMoves;
}

export function getIndexesInDirection(piece, direction) {
    const { row, col } = piece.toIndex();
    const isWhite = piece.color === "white";

    const directionMap = {
        front: [isWhite ? -1 : 1, 0],
        left: [0, isWhite ? -1 : 1],
        right: [0, isWhite ? 1 : -1],
        back: [isWhite ? 1 : -1, 0],
        "top-right": [isWhite ? -1 : 1, isWhite ? 1 : -1],
        "bottom-right": [isWhite ? 1 : -1, isWhite ? 1 : -1],
        "bottom-left": [isWhite ? 1 : -1, isWhite ? -1 : 1],
        "top-left": [isWhite ? -1 : 1, isWhite ? -1 : 1],
    };

    const delta = directionMap[direction];
    if (!delta) {
        console.error("Invalid direction");
        return null;
    }

    const [dRow, dCol] = delta;
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (newRow > 7 || newCol > 7 || newRow < 0 || newCol < 0) {
        return null;
    }

    return [newRow, newCol];
}

export function getIndexesInDirectionFromSquare(indexes, isWhite, direction) {
    const { row, col } = indexes;

    const directionMap = {
        front: [isWhite ? -1 : 1, 0],
        left: [0, isWhite ? -1 : 1],
        right: [0, isWhite ? 1 : -1],
        back: [isWhite ? 1 : -1, 0],
        "top-right": [isWhite ? -1 : 1, isWhite ? 1 : -1],
        "bottom-right": [isWhite ? 1 : -1, isWhite ? 1 : -1],
        "bottom-left": [isWhite ? 1 : -1, isWhite ? -1 : 1],
        "top-left": [isWhite ? -1 : 1, isWhite ? -1 : 1],
    };

    const delta = directionMap[direction];
    if (!delta) {
        console.error("Invalid direction");
        return null;
    }

    const [dRow, dCol] = delta;
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (newRow > 7 || newCol > 7 || newRow < 0 || newCol < 0) {
        return null;
    }

    return [newRow, newCol];
}

/**
 * This function returns ALL moves for given piece, meaning that it includes also same color, as well
 * as opposite color pieces. AND this function does not care about any game logic like pins, defended pieces,
 * checks, etc. This is not function to get LEGAL moves!! It is used only to check - attacks, defends, diagonals,
 * etc.
 * @param {*} piece given piece
 * @param {*} game the game
 */
export function getMoves(piece, game) {
    let theMoves = [];

    switch (piece.type) {
        case "pawn":
            theMoves = getPawnMoves(piece, game);
            break;
        case "knight":
            theMoves = getKnightMoves(piece, game);
            break;
        case "bishop":
            theMoves = getBishopMoves(piece, game);
            break;
        case "rook":
            theMoves = getRookMoves(piece, game);
            break;
        case "queen":
            theMoves = getQueenMoves(piece, game);
            break;
        case "king":
            theMoves = getKingMoves(piece, game);
            break;
        default:
            console.error("Invalid piece type.");
            break;
    }

    return theMoves;
}

function getPawnMoves(piece, game) {
    let theMoves = [];

    // check normal front move - NO - we do not need it, we need only defending and attacking moves

    // check diagonals
    tryPushNeutralMove(legalMoves, safeGetDirection(piece, p => getIndexesInDirection(p, "top-left")), game);
    tryPushNeutralMove(legalMoves, safeGetDirection(piece, p => getIndexesInDirection(p, "top-right")), game);


    // check en passant - NO, we do not need it. 
    return theMoves;
}

function getKnightMoves(piece, game){

    const possibleMoves = getAllKnightMoves(piece);
    return possibleMoves.filter(([r, c]) =>
        r >= 0 && r < 8 &&
        c >= 0 && c < 8
    );
}

function getBishopMoves(piece, game) {
    let theMoves = [];
    const isWhite = piece.color === "white";

    const pieceIndexes = piece.coordinates.toIndex();

    const topLeftDiagonalMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "top-left", game);
    const topRightDiagonalMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "top-right", game);
    const bottomLeftDiagonalMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "bottom-left", game);
    const bottomRightDiagonalMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "bottom-right", game);

    theMoves.push(...topLeftDiagonalMoves);
    theMoves.push(...topRightDiagonalMoves);
    theMoves.push(...bottomLeftDiagonalMoves);
    theMoves.push(...bottomRightDiagonalMoves);

    return theMoves;
}

function getRookMoves(piece, game) {
    let theMoves = [];
    const isWhite = piece.color === "white";

    const pieceIndexes = piece.coordinates.toIndex();

    const frontMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "front", game);
    const backMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "back", game);
    const leftMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "left", game);
    const rightMoves = getNeutralLongRangeMoves(pieceIndexes, isWhite, "right", game);

    theMoves.push(...frontMoves);
    theMoves.push(...backMoves);
    theMoves.push(...leftMoves);
    theMoves.push(...rightMoves);

    return theMoves;
}

function getQueenMoves(piece, game) {
    let theMoves = [];
    const isWhite = piece.color === "white";

    const pieceIndexes = piece.coordinates.toIndex();

    const topLeftDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "top-left", game);
    const topRightDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "top-right", game);
    const bottomLeftDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "bottom-left", game);
    const bottomRightDiagonalMoves = getLongRangeMoves(pieceIndexes, isWhite, "bottom-right", game);
    const frontMoves = getLongRangeMoves(pieceIndexes, isWhite, "front", game);
    const backMoves = getLongRangeMoves(pieceIndexes, isWhite, "back", game);
    const leftMoves = getLongRangeMoves(pieceIndexes, isWhite, "left", game);
    const rightMoves = getLongRangeMoves(pieceIndexes, isWhite, "right", game);

    theMoves.push(...topLeftDiagonalMoves);
    theMoves.push(...topRightDiagonalMoves);
    theMoves.push(...bottomLeftDiagonalMoves);
    theMoves.push(...bottomRightDiagonalMoves);
    theMoves.push(...frontMoves);
    theMoves.push(...backMoves);
    theMoves.push(...leftMoves);
    theMoves.push(...rightMoves);

    return theMoves;
}

function getKingMoves(piece, game){
    let theMoves = [];

    let directions = ["front", "top-right", "right", "bottom-right", "back", "bottom-left", "left", "top-left"];
    let nextElement;
    for (let direction of directions) {
        nextElement = getIndexesInDirection(piece, direction);

        if (nextElement === null) {
            // do nothing
        } else {
            theMoves.push(nextElement);
        }
    }

    return theMoves;
}