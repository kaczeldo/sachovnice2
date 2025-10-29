import * as MoveUtils from "./utils/moveUtils.js";
import * as PieceUtils from "./utils/getPiecesUtils.js";
import { Coordinates } from "./classes/coordinates.js";
import { Piece } from "./classes/piece.js";
import { Game } from "./classes/game.js";

window.onload = function () {
    // needed variables
    const statusBarPar = document.getElementById("status-bar").firstElementChild;
    const boardRows = document.getElementsByClassName("board-row");
    let domPiecesToPlay = []; // in this array will be the DOM elements
    let thereIsOnlyKingToPlayWith = false;
    let isWhitesTurn = true;
    let gameOver = false;    
    

    function startGame() {
        let myGame = new Game();
        startTurn(myGame);
    }

    function startTurn(game) {
        if (gameOver) {
            return;
        }
        domPiecesToPlay = getDOMPieces(game);

        if (domPiecesToPlay.length === 1) {//there is only king to play with
            thereIsOnlyKingToPlayWith = true;
        } else {
            thereIsOnlyKingToPlayWith = false;
        }

        for (let domPiece of domPiecesToPlay) {
            domPiece.addEventListener("click", (event) => handlePieceClick(event, game), { once: true });
        }
    }

    function handlePieceClick(event, game){
        const domPiece = event.target;
        const piece = PieceUtils.getPieceFromDOMPiece(domPiece);
        const isWhite = piece.color === "white";
        const opponentColor = isWhite ? "black" : "white";

        domPiece.addEventListener("click", function cancelHandler(ev) {
            ev.preventDefault();
            cleanUp();
            startTurn();
        }, { once: true});

        const oponnentPieces = getPieces({color: opponentColor}, game);
        const domPieces = PieceUtils.getDOMPiecesFromPieces(oponnentPieces);
        for (let oponnentPiece of domPieces){
            oponnentPiece.addEventListener("click", function cancelDiffHandler(ev) {
                ev.preventDefault();
                cleanUp();
                startTurn();
                handlePieceClick({ target: oponnentPiece});
            }, { once: true});
        }

        // TODO TODO TODO 
    }

    // this function returns DOM elements representing the white pieces
    function getDOMPieces(game) {
        let actualColor = game.isWhitesTurn ? "white" : "black";
        let domPieces = [];
        if (game.isCheck) {
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

    

    function getCheckingPieces(game) {
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

    function getAttackingMoves(possibleChecker, game) {
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

    function getIndexesInDirection(piece, direction) {
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

    function getIndexesInDirectionFromSquare(indexes, isWhite, direction) {
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



    function getPieces({ color = null, type = null } = {}, game) {
        return game.pieces.filter(piece => {
            return (!color || piece.color === color) && (!type || piece.type === type);
        });
    }

    function getLegalMoves(piece, game) {
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
        const possiblePinnedMovesIndexes = pieceIsPinned(piece, game);
        let isPinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            isPinned = true;
        }

        // check normal front move
        const front = MoveUtils.safeGetDirection(piece, p => getIndexesInDirection(p, "front"));
        normalFront: {
            if (front == null) break normalFront;
            if (MoveUtils.isEmptySquare(game, front)) {
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
        MoveUtils.tryPushMove(legalMoves, MoveUtils.safeGetDirection(piece, p => getIndexesInDirection(p, "top-left")), game, oppositeColorSymbol);
        MoveUtils.tryPushMove(legalMoves, MoveUtils.safeGetDirection(piece, p => getIndexesInDirection(p, "top-right")), game, oppositeColorSymbol);


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

    function getLegalBishopMoves(piece, game){
        let legalMoves = [];
        const isWhite = piece.color === "white";
        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(bishop);
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

        if (isPinned) {
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMovesIndexes.includes(legalMove)
            );

            return newLegalMoves;
        }

        return legalMoves;
    }

    function getLegalRookMoves(piece, game){
        let legalMoves = [];
        const isWhite = piece.color === "white";
        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(bishop);
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

        if (isPinned) {
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMovesIndexes.includes(legalMove)
            );

            return newLegalMoves;
        }

        return legalMoves;
    }

    function getLegalQueenMoves(piece, game){
        let legalMoves = [];
        const isWhite = piece.color === "white";
        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(bishop);
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

        if (isPinned) {
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMovesIndexes.includes(legalMove)
            );

            return newLegalMoves;
        }

        return legalMoves;
    }

    function getLegalKingMoves(){

    }

    function pieceIsPinned(piece, game) {
        const isWhite = piece.color === "white";
        const sameColor = isWhite ? "white" : "black";
        const king = getPieces({ color: sameColor, type: "king" }, game); // 1 item array
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
        const pieceSymbol = game.chessBoard[pieceRow, pieceCol];
        game.chessBoard[pieceRow, pieceCol] = "s";// change it to empty square

        // get king long range moves in given direction -> we will check which opposite piece is at the end, if there is one
        let kingMovesInDirection = getLongRangeMoves([kingRow, kingCol], isWhite, direction, game);
        if (kingMovesInDirection == null || kingMovesInDirection.length === 0) {
            // do not forget to add the piece back to board!
            game.chessBoard[pieceRow, pieceCol] = pieceSymbol;

            return null;
        }

        const lastItemIndexes = kingMovesInDirection.at(-1);
        const lastItemSymbol = game.chessBoard[lastItemIndexes[0]][lastItemIndexes[1]];
        const oppositeColorSymbol = isWhite ? "B" : "W";
        if (!(lastItemSymbol.includes(oppositeColorSymbol))) {// if there is no piece looking through the pice on king
            // we know we are not pinned, return null

            // do not forget to add the piece back to board!
            game.chessBoard[pieceRow, pieceCol] = pieceSymbol;

            return null;
        }

        // otherwise check if the piece is the one which can attack in given direction
        // the string is for example "Wb", how to get the last symbol of the string. 
        if (lastItemSymbol.includes(oppositeColorSymbol) && possiblePieceTypes.includes(lastItemSymbol[lastItemSymbol.length - 1])) {
            possibleMovesDuringPin.push(...kingMovesInDirection);
            possibleMovesDuringPin = possibleMovesDuringPin.filter(item => !(item[0] === pieceRow && item[1] === pieceCol));

            // do not forget to add the piece back to board!
            game.chessBoard[pieceRow, pieceCol] = pieceSymbol;

            return possibleMovesDuringPin;
        }

        // do not forget to add the piece back to board!
        game.chessBoard[pieceRow, pieceCol] = pieceSymbol;
        return null;
    }

    function getLongRangeMoves(currentIndexes, isWhite, direction, game) {
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

    startGame();

};