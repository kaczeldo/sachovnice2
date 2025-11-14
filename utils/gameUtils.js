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

export function enPassant(piece, legalMove, game) {
    const isWhite = piece.color === "white";
    const [_, col] = piece.coordinates.toIndex();
    const colDifference = col - DomUtils.getColumnsIndex(legalMove);

    let direction;
    if (colDifference > 0) {
        direction = isWhite ? "left" : "right";
    } else if (colDifference < 0) {
        direction = isWhite ? "right" : "left";
    }

    const indexesNextToPawn = MoveUtils.getIndexesInDirection(piece, direction);
    if (indexesNextToPawn === null) {
        console.error("In enPassant function, could not get indexes next to pawn in give direction: " + direction + " and the pawn is on: " + pawn.coordinates);
        return null;
    }
    const pieceNextToPawn = PieceUtils.getPieceFromIndexes(indexesNextToPawn, game);
    if (pieceNextToPawn === null) {
        console.error("In enPassant function, could not get piece next to pawn in give direction: " + direction + " and the pawn is on: " + pawn.coordinates);
        return null;
    }

    const squareNextToPawn = DomUtils.getDOMPieceFromPiece(pieceNextToPawn);

    let squareElement = document.createElement("span");
    squareElement.className = "square";
    let squareElement2 = document.createElement("span");
    squareElement2.className = "square";

    const domPiece = DomUtils.getDOMPieceFromPiece(piece);
    // part 1: move the piece to legalMove square
    domPiece.parentElement.appendChild(squareElement);
    domPiece.parentElement.removeChild(domPiece);
    legalMove.parentElement.appendChild(domPiece);
    legalMove.parentElement.removeChild(legalMove);

    // part 2: remove the pawn next to our piece, move it to array for taken pieces
    squareNextToPawn.parentElement.appendChild(squareElement2);
    squareNextToPawn.parentElement.removeChild(squareNextToPawn);
    addPieceToRemovedArray(squareNextToPawn);

    // actual PIECE classes updates
    // 1. change coordinates of the piece
    piece.moveTo([DomUtils.getRowIndex(legalMove), DomUtils.getColumnsIndex(legalMove)]);
    // 2. mark the taken piece, the one next to the pawn, as taken
    pieceNextToPawn.take();
}

export function addPieceToRemovedArray(piece) {
    let isWhite = piece.classList.contains("white");

    if (isWhite) {
        let takenWhitePiecesDiv = document.getElementById("taken-white-pieces");
        takenWhitePiecesDiv.appendChild(piece);
    } else {
        let takenBlackPiecesDiv = document.getElementById("taken-black-pieces");
        takenBlackPiecesDiv.appendChild(piece);
    }
    piece.className = "col-1-8";
}

export function castle(piece, legalMove, game) {
    const isWhite = piece.color === "white";
    const myColor = isWhite ? "white" : "black";
    const [row, col] = piece.coordinates.toIndex();
    const colDiff = col - getColumnsIndex(legalMove);
    // find direction
    let direction;
    if (colDiff > 0) {
        direction = isWhite ? "left" : "right";
    } else if (colDiff < 0) {
        direction = isWhite ? "right" : "left";
    }

    //get correct rook
    const rooks = PieceUtils.getPieces({ color: myColor, type: "rook" }, game);
    const [_, r1Col] = rooks[0].coordinates.toIndex();
    const rooksCol = isWhite ? ((direction === "left") ? 0 : 7) : ((direction === "left") ? 7 : 0);
    const theRook = (r1Col === rooksCol) ? rooks[0] : rooks[1];

    const firstInDirection = MoveUtils.getIndexesInDirection(piece, direction);
    const secondInDirection = MoveUtils.getIndexesInDirectionFromSquare(firstInDirection, isWhite, direction);
    const firstDom = DomUtils.getDOMPiece(firstInDirection[0], firstInDirection[1]);
    const sndDom = DomUtils.getDOMPiece(secondInDirection[0], secondInDirection[1]);

    moveToSquare(theRook, firstDom);
    // then get the second square in that direction -> move the king to that square
    moveToSquare(piece, sndDom);
}

export function moveToSquare(piece, legalMove) {
    // this will be useful
    const isWhite = piece.color === "white";
    const oppositeColor = isWhite ? "black" : "white";
    const domPiece = DomUtils.getDOMPieceFromPiece(piece);
    const newIndexes = [DomUtils.getRowIndex(legalMove), DomUtils.getColumnsIndex(legalMove)];

    let squareElement = document.createElement("span");
    squareElement.className = "square";

    // lets check if there is highlighter
    if (legalMove.classList.contains("highlighter")) {
        domPiece.parentElement.appendChild(squareElement);
        domPiece.parentElement.removeChild(domPiece);
        legalMove.parentElement.appendChild(domPiece);
        legalMove.parentElement.removeChild(legalMove);        
        // move the piece:
        
        
    } else if (legalMove.classList.contains(oppositeColor)) {// if it is opponents piece
        domPiece.parentElement.appendChild(squareElement);
        domPiece.parentElement.removeChild(domPiece);
        legalMove.parentElement.appendChild(domPiece);
        legalMove.parentElement.removeChild(legalMove);
        
        addPieceToRemovedArray(legalMove);

        // take the piece on legalMove indexes
        const takenPiece = PieceUtils.getPieceFromIndexes(newIndexes);
        takenPiece.take();
    }

    piece.moveTo(newIndexes);
}