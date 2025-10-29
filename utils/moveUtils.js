/**
 * This function will check if given move is a legalMove - move to empty square or oponnents piece.
 * @param {*} legalMoves array of legal moves.
 * @param {*} directionFn function returning indexes in given direction, may be null
 * @param {*} game instance of Game class, handling top level organization stuff.
 * @param {*} oppositeColorSymbol symbol of opposite color piece, W in case of blacks turn and B in case of whites.
 * @returns nothing
 */
export function tryPushMove(legalMoves, directionFn, game, oppositeColorSymbol){
    const indexes = directionFn();
    if (!indexes) return;

    const [r, c] = indexes;
    const symbol = game.chessBoard[r][c];

    if (symbol === "s" || symbol.includes(oppositeColorSymbol)){
        legalMoves.push(indexes);
    }
}

// returns true if the chess board square is empty
export function isEmptySquare(game, [row, col]){
    return game.chessBoard[row][col] === "s";
}

// returns true if on given indexes there is enemy piece
export function isEnemyPiece(game, [row, col], oppositeColorSymbol) {
    const symbol = game.chessBoard[row][col];
    return symbol.includes(oppositeColorSymbol);
}

// safe get Directoins function -> do not crashes the whole program
export function safeGetDirection(piece, directionFn){
    try {
        return directionFn(piece);
    } catch {
        return null;
    }
}


