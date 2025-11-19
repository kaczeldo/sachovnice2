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

export function cleanUp(game) {
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

function removeAllEventListeners(element) {
    let newEl = element.cloneNode(true);
    element.parentNode.replaceChild(newEl, element);
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
    const legalMoveRow = DomUtils.getRowIndex(legalMove);
    const legalMoveCol = DomUtils.getColumnsIndex(legalMove);
    const legalMoveSymbol = game.chessBoard[legalMoveRow][legalMoveCol];
    let thisIsTakingMove = false;
    if (legalMoveSymbol !== "s") {
        thisIsTakingMove = true;
    }

    // move the piece to new square
    let squareElement = document.createElement("span");
    squareElement.className = "square";
    domPiece.parentElement.appendChild(squareElement);
    domPiece.parentElement.removeChild(domPiece);
    legalMove.parentElement.appendChild(domPiece);
    legalMove.parentElement.removeChild(legalMove);

    // if this was taking move, remove the piece on the place
    if (thisIsTakingMove) {
        const pieceOnPlace = PieceUtils.getPieceFromIndexes([legalMoveRow, legalMoveCol], game);
        if (pieceOnPlace === null) {
            return null;
        }
        addPieceToRemovedArray(legalMove);
        pieceOnPlace.take();
    }

    // UI part
    const rect = domPiece.getBoundingClientRect();

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
            const friendlyPawns = PieceUtils.getPieces({ color: sameColor, type: "pawn" }, game);
            let thePawn;
            for (const aPawn of friendlyPawns) {
                const [pRow, _] = aPawn.coordinates.toIndex(); // the indexes at this point are not updated.
                const increment = isWhite ? -1 : +1;
                if ((pRow + increment) === maxRow) {
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
            // but first update the coordinates of the pawn
            piece.moveTo([legalMoveRow, legalMoveCol]);
            piece.promote(newPieceType);
            const theDomPawn = DomUtils.getDOMPieceFromPiece(thePawn);
            theDomPawn.parentElement.appendChild(newDomPiece);
            theDomPawn.parentElement.removeChild(theDomPawn);
            // and 'shrink' it
            theDomPawn.className = "";

            // and now hide the popup again
            popup.classList.add("hidden");
            console.log("The piece at the end of poromotion: " + piece);

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
            startTurn(game);
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
    const colDiff = col - DomUtils.getColumnsIndex(legalMove);
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

    moveToSquare(theRook, firstDom, game);
    // then get the second square in that direction -> move the king to that square
    moveToSquare(piece, sndDom, game);
}

export function moveToSquare(piece, legalMove, game) {
    const isWhite = piece.color === "white";
    const oppositeColor = isWhite ? "black" : "white";
    const domPiece = DomUtils.getDOMPieceFromPiece(piece);
    const newIndexes = [DomUtils.getRowIndex(legalMove), DomUtils.getColumnsIndex(legalMove)];

    let squareElement = document.createElement("span");
    squareElement.className = "square";

    if (legalMove.classList.contains("highlighter")) {
        domPiece.parentElement.appendChild(squareElement);
        domPiece.parentElement.removeChild(domPiece);
        legalMove.parentElement.appendChild(domPiece);
        legalMove.parentElement.removeChild(legalMove);
    } else if (legalMove.classList.contains(oppositeColor)) {// if it is opponents piece
        domPiece.parentElement.appendChild(squareElement);
        domPiece.parentElement.removeChild(domPiece);
        legalMove.parentElement.appendChild(domPiece);
        legalMove.parentElement.removeChild(legalMove);

        addPieceToRemovedArray(legalMove);

        const takenPiece = PieceUtils.getPieceFromIndexes(newIndexes, game);
        takenPiece.take();
    }
    piece.moveTo(newIndexes);
}

export function endTurn(game) {
    /**
     * what must happen when the turn has come to an end:
     * 1. Change colors
     * 2. Update the chessboard based on the piece statuses and coordinations
     * 3. Clean up highlighters, etc.
     */
    Globals.setIsWhitesTurn(!(Globals.isWhitesTurn));

    updateChessBoard(game);

    cleanUp(game);
}

export function updateChessBoard(game) {
    /**
     * There are two basic things to handle:
     * 1. Go through all pieces and remove the pieces from the board, which have isTaken set to true
     * 2. Go through all pieces and based ond their coordinates, update their position on the chessboard
     *  a) detect symbols which do not correspond to any of the pieces - remove them
     *  b) go through pieces and check if they are on the board, if not add them
     */
    const allPieces = game.pieces;
    for (let piece of allPieces) {
        const symbol = PieceUtils.getSymbolForPiece(piece);
        const [r, c] = piece.coordinates.toIndex();
        let onBoard;
        if (!(piece.wasRemoved)) {
            onBoard = game.chessBoard[r][c];
        }

        if (piece.wasTaken && !(piece.wasRemoved)) {
            if (symbol === onBoard) {
                game.chessBoard[r][c] = "s";
            }
            piece.coordinates.change(8, 8); // set coordinates to unreal coordinates
            piece.wasRemoved = true;
        } else if (piece.wasRemoved) {
            // do nothing - should be solved
        } else if (symbol !== onBoard) { // then we are working with active pieces
            game.chessBoard[r][c] = symbol;
        }
    }

    // now go through each chess board square and find non-empty squares
    let nonEmptyIndexes = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const onBoard = game.chessBoard[i][j];
            if (onBoard !== "s") {
                nonEmptyIndexes.push([i, j]);
            }
        }
    }

    // each non empty square must correspond with an active piece
    let activePieces = [];
    for (let piece of allPieces) {
        if (!(piece.wasTaken)) {
            activePieces.push(piece);
        }
    }
    for (let piece of activePieces) {
        const [r, c] = piece.coordinates.toIndex();
        const symbol = PieceUtils.getSymbolForPiece(piece);

        const exists = nonEmptyIndexes.some(([nr, nc]) => nr === r && nc === c);

        if (exists && game.chessBoard[r][c] === symbol) {
            nonEmptyIndexes = nonEmptyIndexes.filter(([mR, mC]) => !((mR === r) && (mC === c)));
        }
    }

    // now we are left with the non empty indexes, which are not corresponding with and piece -> change them to "s"
    for (const [r, c] of nonEmptyIndexes) {
        game.chessBoard[r][c] = "s";
    }

    showBoard(game);
}

function showBoard(game) {
    for (let i = 0; i < 8; i++) {
        let row = ""
        for (let j = 0; j < 8; j++) {
            row = row + game.chessBoard[i][j] + " ";
        }
        console.log(row);
    }
}

export function startTurn(game) {
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
        domPiece.addEventListener("click", (event) => Ui.handlePieceClick(event, game), { once: true });
    }
}

export function startGame() {
    let myGame = new Game();
    GameUtils.startTurn(myGame);
}