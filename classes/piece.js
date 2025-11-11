import * as MoveUtils from "../utils/moveUtils.js";
import * as PieceUtils from "../utils/getPiecesUtils.js";
import * as ConditionUtils from "../utils/conditionUtils.js";
import { Coordinates } from "./coordinates.js";
import { Game } from "./game.js";


export class Piece {
    constructor(color, type, coordinates) {
        this.color = color;
        this.type = type;
        this.coordinates = coordinates;

        // static stuff - initial values 
        this.wasTaken = false;
        this.hasMoved = false;
        this.hasDoubleJumped = false;
    }
}