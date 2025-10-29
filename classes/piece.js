
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