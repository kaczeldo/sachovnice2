import * as MoveUtils from "../utils/moveUtils.js";
import * as PieceUtils from "../utils/getPiecesUtils.js";
import * as ConditionUtils from "../utils/conditionUtils.js";
import { Piece } from "./piece.js";
import { Game } from "./game.js";

export class Coordinates {
    constructor(x, y) {
        this.x = x;// 0 - 7 for chess board columns
        this.y = y;// 0 - 7 for rows
    }

    equals(indexes) {
        return this.y === indexes[0] && this.x === indexes[1];
    }

    toString() {
        return String.fromCharCode(97 + this.x) + (8 - this.y);
    }

    change(x, y) {
        this.x = x;
        this.y = y;
    }

    toIndex() {
        return [this.y, this.x];
    }
}