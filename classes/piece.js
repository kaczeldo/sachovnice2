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
        this.hasDoubleJumpedNow = false;
        this.wasRemoved = false; // answers if the piece was removed from the board.
    }

    moveTo(indexes){
        this.coordinates.change(indexes[1], indexes[0]);
        this.hasMoved = true;
    }

    take(){
        this.wasTaken = true;
    }

    promote(newType){
        this.type = newType;
    }

    toString(){
        return "type: " + this.type + ", color: " + this.color + ", coords: " + this.coordinates;
    }


}