export class Coordinates {
    constructor(x, y) {
        this.x = x;// 0 - 7 for chess board columns
        this.y = y;// 0 - 7 for rows
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
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