import * as MoveUtils from "./moveUtils.js";
import * as PieceUtils from "./getPiecesUtils.js";
import * as DomUtils from "./domUtils.js";
import * as Ui from "./ui.js";
import * as GameUtils from "./gameUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";
import * as Globals from "../classes/globals.js";

let statusBarPar;

export function initiateStatusBar(domElement) {
    statusBarPar = domElement;
}

export function updateStatusBar(message) {
    statusBarPar.textContent = message;
}

export function highlightMoves(legalMoves) {
    let newLegalMoves = []
    for (let legalMove of legalMoves) {
        if (legalMove.classList.contains("square")) {
            let highlighter = document.createElement("img");
            highlighter.src = "./highlighter.svg";
            highlighter.className = "highlighter";

            legalMove.parentElement.appendChild(highlighter);
            legalMove.parentElement.removeChild(legalMove);
            newLegalMoves.push(highlighter);
        } else {
            newLegalMoves.push(legalMove);
        }
    }

    return newLegalMoves;
}

export function handlePieceClick(event, game) {
    const domPiece = event.target;
    const piece = DomUtils.getPieceFromDOMPiece(domPiece, game);
    const isWhite = piece.color === "white";
    const sameColor = isWhite ? "white" : "black";

    domPiece.addEventListener("click", function cancelHandler(ev) {
        ev.preventDefault();
        GameUtils.cleanUp(game);
        GameUtils.startTurn(game);
    }, { once: true });

    const friendlyPieces = PieceUtils.getPieces({ color: sameColor }, game);
    const domPieces = DomUtils.getDOMPiecesFromPieces(friendlyPieces);
    for (let friendlyPiece of domPieces) {
        friendlyPiece.addEventListener("click", function cancelDiffHandler(ev) {
            ev.preventDefault();
            GameUtils.cleanUp(game);
            GameUtils.startTurn(game);
        }, { once: true });
    }

    let legalMoves = [];
    if ((Globals.isWhitesTurn && Globals.isWhiteInCheck) || (!(Globals.isWhitesTurn) && Globals.isBlackInCheck)) {
        legalMoves = MoveUtils.getLegalCheckMoves(piece, game);
    } else {
        legalMoves = MoveUtils.getLegalMoves(piece, game);
    }

    // convert legalMoves - which currently are just indexes of legal moves, 
    // to actual dom elements
    console.log("The legal moves before calling getDOM function: " + legalMoves);
    let legalDomMoves = DomUtils.getDOMElementsFromIndexes(legalMoves);
    // HIGHLIGHT EMPTY-SQUARE MOVES
    legalDomMoves = Ui.highlightMoves(legalDomMoves, game);

    // now handle the moves
    for (let legalMove of legalDomMoves) {
        legalMove.addEventListener("click", function moveHandler(event) {
            event.preventDefault();

            if (ConditionUtils.thisIsPawnSpecialMove(piece, legalMove, game)) {
                piece.hasDoubleJumped = true;
            }
            let thisIsPromotion = false;
            if (ConditionUtils.thisIsPawnPromotionMove(piece, legalMove)) {
                thisIsPromotion = true;
                //GameUtils.moveAndPromote(piece, legalMove, game);
            } else if (ConditionUtils.thisIsEnPassantMove(piece, legalMove, game)) {
                GameUtils.enPassant(piece, legalMove, game);
            } else if (ConditionUtils.thisIsCastleMove(piece, legalMove)) {
                GameUtils.castle(piece, legalMove, game);
            } else {
                GameUtils.moveToSquare(piece, legalMove, game);
            }

            if (thisIsPromotion) {
                GameUtils.moveAndPromote(piece, legalMove, game);
            } else {
                // after the move, put down check flags
                Globals.setIsWhiteInCheck(false);
                Globals.setIsBlackInCheck(false);

                // update the board before checking
                GameUtils.updateChessBoard(game);
                const nrOfCheckingPieces = (PieceUtils.getCheckingPieces(isWhite, game)).length;

                if (Globals.isWhitesTurn && nrOfCheckingPieces > 0) {
                    Globals.setIsBlackInCheck(true);
                } else if ((!(Globals.isWhitesTurn)) && nrOfCheckingPieces > 0) {
                    Globals.setIsWhiteInCheck(true);
                }

                if (nrOfCheckingPieces >= 2) {
                    Globals.setIsDoubleCheck(true);
                } else {
                    Globals.setIsDoubleCheck(false);
                }
                GameUtils.endTurn(game);
                GameUtils.startTurn(game);
            }


        }, { once: true });
    }
}