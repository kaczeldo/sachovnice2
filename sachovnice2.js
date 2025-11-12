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
    const boardRows = document.getElementsByClassName("board-row");

    function startGame() {
        let myGame = new Game();
        startTurn(myGame);
    }

    function startTurn(game) {
        if (Globals.gameOver) {
            return;
        }
        Globals.domPiecesToPlay = PieceUtils.getDOMPieces(game);

        // set message
        if (Globals.isWhitesTurn){
            Ui.updateStatusBar("White to play.");
        } else {
            Ui.initiateStatusBar("Black to play.");
        }        

        if (Globals.domPiecesToPlay.length === 1) {//there is only king to play with
            Globals.thereIsOnlyKingToPlayWith = true;
        } else {
            Globals.thereIsOnlyKingToPlayWith = false;
        }

        for (let domPiece of Globals.domPiecesToPlay) {
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
            GameUtils.cleanUp(game);
            startTurn();
        }, { once: true });

        const oponnentPieces = PieceUtils.getPieces({ color: opponentColor }, game);
        const domPieces = PieceUtils.getDOMPiecesFromPieces(oponnentPieces);
        for (let oponnentPiece of domPieces) {
            oponnentPiece.addEventListener("click", function cancelDiffHandler(ev) {
                ev.preventDefault();
                GameUtils.cleanUp(game);
                startTurn();
                handlePieceClick({ target: oponnentPiece });
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