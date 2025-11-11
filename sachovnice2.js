import * as MoveUtils from "./utils/moveUtils.js";
import * as PieceUtils from "./utils/getPiecesUtils.js";
import * as ConditionUtils from "./utils/conditionUtils.js";
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
    let isWhiteInCheck = false;
    let isBlackInCheck = false;

    function startGame() {
        let myGame = new Game();
        startTurn(myGame);
    }

    function startTurn(game) {
        if (gameOver) {
            return;
        }
        domPiecesToPlay = PieceUtils.getDOMPieces(game);

        if (domPiecesToPlay.length === 1) {//there is only king to play with
            thereIsOnlyKingToPlayWith = true;
        } else {
            thereIsOnlyKingToPlayWith = false;
        }

        for (let domPiece of domPiecesToPlay) {
            domPiece.addEventListener("click", (event) => handlePieceClick(event, game), { once: true });
        }
    }

    function handlePieceClick(event, game) {
        const domPiece = event.target;
        const piece = PieceUtils.getPieceFromDOMPiece(domPiece);
        const isWhite = piece.color === "white";
        const opponentColor = isWhite ? "black" : "white";

        domPiece.addEventListener("click", function cancelHandler(ev) {
            ev.preventDefault();
            cleanUp();
            startTurn();
        }, { once: true });

        const oponnentPieces = PieceUtils.getPieces({ color: opponentColor }, game);
        const domPieces = PieceUtils.getDOMPiecesFromPieces(oponnentPieces);
        for (let oponnentPiece of domPieces) {
            oponnentPiece.addEventListener("click", function cancelDiffHandler(ev) {
                ev.preventDefault();
                cleanUp();
                startTurn();
                handlePieceClick({ target: oponnentPiece });
            }, { once: true });
        }

        let legalMoves = [];
        if (game.isBlackCheck || game.isWhiteCheck) {
            legalMoves = getLegalCheckMoves(piece, game);
        } else {
            legalMoves = MoveUtils.getLegalMoves(piece, game);
        }

        // HIGHLIGHT EMPTY-SQUARE MOVES
        legalMoves = highlightMoves(legalMoves);

        // now handle the moves
        for (let legalMove of legalMoves) {
            legalMove.addEventListener("click", function moveHandler(event) {
                event.preventDefault();

                if (thisIsPawnSpecialMove(piece, legalMove, game)) {
                    piece.hasDoubleJumped = true;
                }

                if (thisIsPawnPromotionMove(piece, legalMove, game)) {
                    moveAndPromote(piece, legalMove, game);
                } else if (thisIsEnPassantMove(piece, legalMove, game)) {
                    enPassant(piece, legalMove, game);
                } else if (thisIsCastleMove(piece, legalMove, game)) {
                    castle(piece, legalMove, game);
                } else {
                    moveToSquare(piece, legalMove, game);
                }

                // after the move, put down check flags
                isWhiteInCheck = false;
                isBlackInCheck = false;

                let nrOfCheckingPieces = isCheck();

                if (isWhitesTurn && nrOfCheckingPieces > 0) {
                    isWhiteInCheck = true;
                } else if ((!(isWhitesTurn)) && nrOfCheckingPieces > 0) {
                    isBlackInCheck = true;
                }

                if (nrOfCheckingPieces >= 2) {
                    isDoubleCheck = true;
                } else {
                    isDoubleCheck = false;
                }

                isWhitesTurn = !isWhitesTurn;

                cleanUp();

                startTurn(game);
            }, { once: true });
        }
    }

    startGame();

};