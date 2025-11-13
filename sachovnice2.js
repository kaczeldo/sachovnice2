import * as MoveUtils from "./utils/moveUtils.js";
import * as PieceUtils from "./utils/getPiecesUtils.js";
import * as ConditionUtils from "./utils/conditionUtils.js";
import { Coordinates } from "./classes/coordinates.js";
import { Piece } from "./classes/piece.js";
import { Game } from "./classes/game.js";
import * as Globals from "./classes/globals.js";
import * as Ui from "./utils/ui.js"
import * as GameUtils from "./utils/gameUtils.js";
import * as DomUtils from "./utils/domUtils.js";

window.onload = function () {
    // needed variables
    Ui.initiateStatusBar(document.getElementById("status-bar").firstElementChild);

    function startGame() {
        let myGame = new Game();
        startTurn(myGame);
    }

    function startTurn(game) {
        if (Globals.gameOver) {
            return;
        }
        Globals.setDomPiecesToPlay(DomUtils.getDOMPieces(game));      

        if (Globals.domPiecesToPlay.length === 1) {//there is only king to play with
            Globals.setOnlyKingToPlay(true);
        } else {
            Globals.setOnlyKingToPlay(false);
        }

        for (let domPiece of Globals.domPiecesToPlay) {
            domPiece.addEventListener("click", (event) => handlePieceClick(event, game), { once: true });
        }
    }

    function handlePieceClick(event, game) {
        const domPiece = event.target;
        const piece = DomUtils.getPieceFromDOMPiece(domPiece, game);
        const isWhite = piece.color === "white";
        const opponentColor = isWhite ? "black" : "white";
        const sameColor = isWhite ? "white" : "black";

        domPiece.addEventListener("click", function cancelHandler(ev) {
            ev.preventDefault();
            GameUtils.cleanUp(game);
            startTurn();
        }, { once: true });

        const friendlyPieces = PieceUtils.getPieces({ color: sameColor }, game);
        const domPieces = DomUtils.getDOMPiecesFromPieces(friendlyPieces);
        for (let friendlyPiece of domPieces) {
            friendlyPiece.addEventListener("click", function cancelDiffHandler(ev) {
                ev.preventDefault();
                GameUtils.cleanUp(game);
                startTurn();
                handlePieceClick({ target: friendlyPiece });
            }, { once: true });
        }

        let legalMoves = [];
        if (Globals.isWhiteInCheck || Globals.isBlackInCheck) {
            legalMoves = MoveUtils.getLegalCheckMoves(piece, game);
        } else {
            legalMoves = MoveUtils.getLegalMoves(piece, game);
        }

        // convert legalMoves - which currently are just indexes of legal moves, 
        // to actual dom elements
        let legalDomMoves = DomUtils.getDOMElementsFromIndexes(legalMoves, game);
        // HIGHLIGHT EMPTY-SQUARE MOVES
        legalDomMoves = Ui.highlightMoves(legalDomMoves, game);

        // now handle the moves
        for (let legalMove of legalDomMoves) {
            legalMove.addEventListener("click", function moveHandler(event) {
                event.preventDefault();

                if (ConditionUtils.thisIsPawnSpecialMove(piece, legalMove, game)) {
                    piece.hasDoubleJumped = true;
                }
                if (ConditionUtils.thisIsPawnPromotionMove(piece, legalMove)) {
                    GameUtils.moveAndPromote(piece, legalMove, game);
                } else if (ConditionUtils.thisIsEnPassantMove(piece, legalMove, game)) {
                    enPassant(piece, legalMove, game);
                } else if (thisIsCastleMove(piece, legalMove, game)) {
                    castle(piece, legalMove, game);
                } else {
                    moveToSquare(piece, legalMove, game);
                }

                // after the move, put down check flags
                Globals.isWhiteInCheck = false;
                Globals.isBlackInCheck = false;

                let nrOfCheckingPieces = isCheck();

                if (Globals.isWhitesTurn && nrOfCheckingPieces > 0) {
                    Globals.isWhiteInCheck = true;
                } else if ((!(Globals.isWhitesTurn)) && nrOfCheckingPieces > 0) {
                    Globals.isBlackInCheck = true;
                }

                if (nrOfCheckingPieces >= 2) {
                    Globals.isDoubleCheck = true;
                } else {
                    Globals.isDoubleCheck = false;
                }

                Globals.isWhitesTurn = !(Globals.isWhitesTurn);

                cleanUp();

                startTurn(game);
            }, { once: true });
        }
    }

    startGame();

};