import * as MoveUtils from "./moveUtils.js";
import * as PieceUtils from "./getPiecesUtils.js";
import * as Ui from "./ui.js";
import * as GameUtils from "./gameUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
import * as DomUtils from "./domUtils.js";
import { Coordinates } from "../classes/coordinates.js";
import { Piece } from "../classes/piece.js";
import { Game } from "../classes/game.js";
import * as Globals from "../classes/globals.js";

export function cleanUp() {
    // remove highlighters
    let highlighters = document.querySelectorAll(".highlighter");

    for (let highlighter of highlighters) {
        let square = document.createElement("span");
        square.classList = "square";
        highlighter.parentElement.appendChild(square);
        highlighter.parentElement.removeChild(highlighter);
    }

    // mark pawns which did jumped doulbe move THIS ROUND!
    const allPawns = PieceUtils.getPieces({ type: "pawn" }, game);
    for (let pawn of allPawns) {
        if (pawn.hasDoubleJumped && !(pawn.hasDoubleJumpedNow)) {
            pawn.hasDoubleJumpedNow = true;
        } else {
            pawn.hasDoubleJumpedNow = false;
            pawn.hasDoubleJumped = false;
        }
    }

    // remove all event listeners
    document.querySelectorAll(".piece").forEach(removeAllEventListeners);
}

export function moveAndPromote(piece, legalMove, game) {
    let popup;
    const domPiece = DomUtils.getDOMPieceFromPiece(piece);
    const isWhite = piece.color === "white";
    const sameColor = isWhite ? "white" : "black";
    if (isWhite) {
        popup = document.getElementById("popup-white");
    } else {
        popup = document.getElementById("popup-black");
    }

    // move the piece to new square
    let squareElement = document.createElement("span");
    squareElement.className = "square";
    domPiece.parentElement.appendChild(squareElement);
    domPiece.parentElement.removeChild(domPiece);
    legalMove.parentElement.appendChild(domPiece);
    legalMove.parentElement.removeChild(legalMove);

    const rect = piece.getBoundingClientRect();

    popup.style.left = `${rect.right + 10}px`;
    popup.style.top = `${rect.top}px`;

    popup.classList.toggle("hidden");
    // cleanup previous listeners:
    for (let figure of popup.children) {
        const clone = figure.cloneNode(true);
        figure.replaceWith(clone);
    }

    for (let figure of popup.children) {
        figure.addEventListener("click", function promote(event) {
            event.preventDefault();

            // FIND THE ACTUAL PAWN
            const maxRow = isWhite ? 0 : 7;
            const friendlyPawns = PieceUtils.getPieces({ type: "pawn" }, game);
            let allPawns = document.getElementsByClassName(sameColor + " piece pawn");
            let thePawn;
            for (let aPawn of friendlyPawns) {
                const [pRow, _] = aPawn.coordinates.toIndex();
                if (pRow === maxRow) {
                    thePawn = aPawn;
                    break;
                }
            }

            if (thePawn === undefined) {
                console.error("The pawn was not found.");
                return;
            } else {

            }

            let newPieceType;
            let newSrc;
            // now based on the piece type change clothes of the pawn to new piece
            const selectedPiece = event.target;
            const imageType = selectedPiece.getAttribute('src');
            if (imageType.includes("queen")) {
                newPieceType = "queen";
                newSrc = `./queen_${sameColor}.svg`;
            } else if (imageType.includes("rook")) {
                newPieceType = "rook";
                newSrc = `./rook_${sameColor}.svg`;
            } else if (imageType.includes("knight")) {
                newPieceType = "knight";
                newSrc = `./knight_${sameColor}.svg`;
            } else if (imageType.includes("bishop")) {
                newPieceType = "bishop";
                newSrc = `./bishop_${sameColor}.svg`;
            }

            // CREATE NEW PIECE
            let newDomPiece = document.createElement("img");
            newDomPiece.className = sameColor + " piece " + newPieceType;
            newDomPiece.src = newSrc;

            // replace the pawn with the piece
            const theDomPawn = DomUtils.getDOMPieceFromPiece(theDomPawn);
            theDomPawn.parentElement.appendChild(newDomPiece);
            theDomPawn.parentElement.removeChild(theDomPawn);
            // and 'shrink' it
            theDomPawn.className = "";

            // and now hide the popup again
            popup.classList.add("hidden");

            // the only possiblity is that we gave a check to opponent, this we check below:
            // here we will store how many pieces checks the king
            const nrOfCheckingPieces = isKingInCheck(isWhite);

            // the color of potentially checked king
            const checkedKingColor = isWhite ? "black" : "white";
            // below, based on number of checking pieces and color, we raise the flag
            if (checkedKingColor === "white" && nrOfCheckingPieces > 0) {
                Globals.setIsWhiteInCheck(true);
            } else if (checkedKingColor === "black" && nrOfCheckingPieces > 0) {
                Globals.setIsBlackInCheck(true);
            } else if (checkedKingColor === "white" && nrOfCheckingPieces === 0) {
                Globals.setIsWhiteInCheck(false);
            } else if (checkedKingColor === "black" && nrOfCheckingPieces === 0) {
                Globals.setIsBlackInCheck(false);
            }

            if (nrOfCheckingPieces >= 2) {
                Globals.setIsDoubleCheck(true);
            } else if (nrOfCheckingPieces < 2) {
                Globals.setIsDoubleCheck(false);
            }

            // update the piece / not the DOM one!
            // legal move indexes - use the move indexes as new coordinates of the piece
            const legalMoveRow = getRowIndex(legalMove);
            const legalMoveCol = getColumnsIndex(legalMove);
            piece.moveTo([legalMoveRow, legalMoveCol]);
            piece.promote(newPieceType);

        }, { once: true });
    }
}