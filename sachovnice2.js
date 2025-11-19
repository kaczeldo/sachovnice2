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

    GameUtils.startGame();
};