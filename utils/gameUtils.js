import * as MoveUtils from "./moveUtils.js";
import * as PieceUtils from "./getPiecesUtils.js";
import * as Ui from "./ui.js";
import * as GameUtils from "./gameUtils.js";
import * as ConditionUtils from "./conditionUtils.js";
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
    const allPawns = PieceUtils.getPieces({type: "pawn"}, game);
    for (let pawn of allPawns){
        if(pawn.hasDoubleJumped && !(pawn.hasDoubleJumpedNow)){
            pawn.hasDoubleJumpedNow = true;
        } else {
            pawn.hasDoubleJumpedNow = false;
            pawn.hasDoubleJumped = false;
        }
    }

    // remove all event listeners
    document.querySelectorAll(".piece").forEach(removeAllEventListeners);
}