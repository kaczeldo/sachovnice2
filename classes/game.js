import * as MoveUtils from "../utils/moveUtils.js";
import * as PieceUtils from "../utils/getPiecesUtils.js";
import * as ConditionUtils from "../utils/conditionUtils.js";
import { Coordinates } from "./coordinates.js";
import { Piece } from "./piece.js";

export class Game {
    constructor() {
        this.pieces = [];
        this.chessBoard = [];
        this.isWhiteCheck = false;
        this.isBlackCheck = false;
        this.isDoubleCheck = false;

        this.setupInitialPosition();
        this.setupChessBoard();
    }

    setupChessBoard() {
        // fill the chess board with empty squares -> "s"
        for (let i = 0; i < 8; i++) {
            this.chessBoard.push([]);
            for (let j = 0; j < 8; j++) {
                this.chessBoard[i].push("s");
            }
        }

        // go through all pieces
        for (let piece of this.pieces) {
            const pieceIndexes = piece.coordinates.toIndex();
            const symbol = PieceUtils.getSymbolForPiece(piece);
            this.chessBoard[pieceIndexes[0]][pieceIndexes[1]] = symbol;
        }
    }

    setupInitialPosition() {
        // helper for clarity
        const add = (color, type, x, y) =>
            this.pieces.push(new Piece(color, type, new Coordinates(x, y)));

        // pawns
        for (let x = 0; x < 8; x++) {
            add("white", "pawn", x, 6);
            add("black", "pawn", x, 1);
        }

        // rooks
        add("white", "rook", 0, 7);
        add("white", "rook", 7, 7);
        add("black", "rook", 0, 0);
        add("black", "rook", 7, 0);

        // knights
        add("white", "knight", 1, 7);
        add("white", "knight", 6, 7);
        add("black", "knight", 1, 0);
        add("black", "knight", 6, 0);

        // bishops
        add("white", "bishop", 2, 7);
        add("white", "bishop", 5, 7);
        add("black", "bishop", 2, 0);
        add("black", "bishop", 5, 0);

        // queens
        add("white", "queen", 3, 7);
        add("black", "queen", 3, 0);

        // kings
        add("white", "king", 4, 7);
        add("black", "king", 4, 0);
    }
}