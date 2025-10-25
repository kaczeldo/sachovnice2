window.onload = function () {
    // needed variables
    const statusBarPar = document.getElementById("status-bar").firstElementChild;
    const boardRows = document.getElementsByClassName("board-row");
    let domPiecesToPlay = []; // in this array will be the DOM elements
    class Coordinates {
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

    class Piece {
        constructor(color, type, coordinates) {
            this.color = color;
            this.type = type;
            this.coordinates = coordinates;

            // static stuff - initial values 
            this.wasTaken = false;
            this.hasMoved = false;
        }
    }

    class Game {
        constructor() {
            this.isWhitesTurn = true;
            this.gameOver = false;
            this.pieces = [];
            this.chessBoard = [];
            this.isCheck = false;
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
                const pieceIndexes = piece.toIndex();
                const symbol = getSymbolForPiece(piece);
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
    function getSymbolForPiece(piece) {
        const map = {
            pawn: "p",
            knight: "n",
            bishop: "b",
            rook: "r",
            queen: "q",
            king: "k"
        };
        let symbol = map[piece.type] || "s";
        return piece.color === "white" ? symbol.toUpperCase() : symbol;
    }

    function startGame() {
        let myGame = new Game();
        startTurn(myGame);
    }

    function startTurn(game) {
        if (game.gameOver) {
            return;
        }
        domPiecesToPlay = getDOMPieces(game);

        if (domPiecesToPlay.length === 1) {//there is only king to play with
            thereIsOnlyKingToPlayWith = true;
        } else {
            thereIsOnlyKingToPlayWith = false;
        }

        for (let domPiece of domPiecesToPlay) {
            domPiece.addEventListener("click", handlePieceClick, { once: true });
        }
    }

    // this function returns DOM elements representing the white pieces
    function getDOMPieces(game) {
        let actualColor = game.isWhitesTurn ? "white" : "black";
        let domPieces = [];
        if (game.isCheck) {
            statusBarPar.textContent = actualColor + " to play, " + actualColor + " is in CHECK!";
            // add only pieces which can play in check
            // add king - this is always true
            domPieces.push(...getPieces({ color: actualColor, type: "king" }, game));

            if (game.isDoubleCheck) {
                return domPieces;
            }

            // first find the pieces which are giving check
            let checkingPieces = getCheckingPieces(game);
            // check if this is only one piece -> must be
            if (!(checkingPieces.length === 1)) {
                return null;
            }

            // now add pieces which can block the check
            let checkBlockingPieces = getCheckBlockingPieces(game, checkingPieces);
            if (checkBlockingPieces === null) {
                return null;
            } else {
                domPieces.push(...checkBlockingPieces);
            }

            let checkerTakingPieces = getCheckerTakingPieces(game, checkingPieces);
            if (checkerTakingPieces === null) {
                return null;
            } else {
                domPieces.push(...checkerTakingPieces);
            }

            // avoid duplicities
            domPieces = [...new Set(domPieces)];

        } else { // if it is not a check
            statusBarPar.textContent = actualColor + " to play";
            const actualPieces = getPieces({ color: actualColor }, game);
            for (let piece of actualPieces) {
                const pieceIndexes = piece.toIndex();
                domPieces.push(getDOMPiece(pieceIndexes[0], pieceIndexes[1]));
            }
        }

        return domPieces;
    }

    // very important function. Returns DOM index based on row and col indexes
    function getDOMPiece(rowIndex, colIndex) {
        // check if indexes are in the valid range
        if (rowIndex === null || colIndex === null || rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0) {
            return null;
        }
        return boardRows[rowIndex].children[colIndex].firstElementChild;
    }

    function getCheckingPieces(game) {
        let checkingPieces = [];
        // color of the actual playing side
        const actualColor = game.isWhitesTurn ? "white" : "black";
        const oppositeColor = game.isWhitesTurn ? "black" : "white";
        // get the king
        const kingInCheck = getPieces({ color: actualColor, type: "king" }, game);//this is one item array

        // get possible attackers - opposite color pieces
        const oppositeColorPieces = getPieces({ color: oppositeColor }, game);
        let pieceAttackingMoves;
        for (let possibleChecker of oppositeColorPieces) {
            pieceAttackingMoves = getAttackingMoves(possibleChecker, game);

        }

    }

    function getAttackingMoves(possibleChecker, game) {
        let attackingMoves = [];
        switch (possibleChecker.type) {
            case "pawn":
                attackingMoves = getPawnAttackingMoves(possibleChecker, game);
                break;
            case "knight":
                attackingMoves = getLegalKnightMoves(possibleChecker, game);
                break;
            case "bishop":
                attackingMoves = getLegalBishopMoves(possibleChecker, game);
                break;
            case "rook":
                attackingMoves = getLegalRookMoves(possibleChecker, game);
                break;
            case "queen":
                attackingMoves = getLegalQueenMoves(possibleChecker, game);
                break;
            case "king":
                attackingMoves = getLegalKingMoves(possibleChecker, game);
                break;
            default:
                console.error("invalid piece type");
                break;
        }

        return attackingMoves;
    }

    function getPawnAttackingMoves(piece, game) {
        let attackingMoves = [];
        const isWhite = piece.color === "white";
        const topLeftIndexes = getIndexesInDirection(piece, "top-left");
        let elementOnIndex;
        if (!(topLeftIndexes == null)) {
            elementOnIndex = game.chessBoard[topLeftIndexes[0]][topLeftIndexes[1]];
        }

        if (elementOnIndex === "s" || (isWhite !== isUpperCase(elementOnIndex))) {
            attackingMoves.push(topLeftIndexes);
        }

        const topRightIndexes = getIndexesInDirection(piece, "top-right");
        if (!(topRightIndexes == null)) {
            elementOnIndex = game.chessBoard[topRightIndexes[0]][topRightIndexes[1]];
        }

        if (elementOnIndex === "s" || (isWhite !== isUpperCase(elementOnIndex))) {
            attackingMoves.push(topRightIndexes);
        }

        return attackingMoves;
    }

    function isUpperCase(char) {
        return char === char.toUpperCase();
    }

    function getIndexesInDirection(piece, direction) {
        const { row, col } = piece.toIndex();
        const isWhite = piece.color === "white";

        const directionMap = {
            front: [isWhite ? -1 : 1, 0],
            left: [0, isWhite ? -1 : 1],
            right: [0, isWhite ? 1 : -1],
            back: [isWhite ? 1 : -1, 0],
            "top-right": [isWhite ? -1 : 1, isWhite ? 1 : -1],            
            "bottom-right": [isWhite ? 1 : -1, isWhite ? 1 : -1],            
            "bottom-left": [isWhite ? 1 : -1, isWhite ? -1 : 1],            
            "top-left": [isWhite ? -1 : 1, isWhite ? -1 : 1],
        };

        const delta = directionMap[direction];
        if (!delta) {
            console.error("Invalid direction");
            return null;
        }

        const [dRow, dCol] = delta;
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (newRow > 7 || newCol > 7 || newRow < 0 || newCol < 0) {
            return null;
        }

        return [newRow, newCol];
    }

    function getPieces({ color = null, type = null } = {}, game) {
        return game.pieces.filter(piece => {
            return (!color || piece.color === color) && (!type || piece.type === type);
        });
    }
};