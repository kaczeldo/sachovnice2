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