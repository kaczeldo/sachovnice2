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
            this.hasDoubleJumped = false;
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
        const isWhite = piece.color === "white";
        const map = {
            pawn: "p",
            knight: "n",
            bishop: "b",
            rook: "r",
            queen: "q",
            king: "k"
        };
        let symbol = map[piece.type] || "s";
        let finalString = isWhite ? "W" : "B";
        return finalString + symbol;
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
                attackingMoves = getAttackingKingMoves(possibleChecker, game);
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
        const oppositeColorSymbol = isWhite ? "B" : "W";
        if (!(topLeftIndexes == null)) {
            const topLeftElement = game.chessBoard[topLeftIndexes[0]][topLeftIndexes[1]];
            if (topLeftElement === "s" || topLeftElement.includes(oppositeColorSymbol)) {
                attackingMoves.push(topLeftIndexes);
            }
        }

        const topRightIndexes = getIndexesInDirection(piece, "top-right");
        if (!(topRightIndexes == null)) {
            const topRightElement = game.chessBoard[topRightIndexes[0]][topRightIndexes[1]];
            if (topRightElement === "s" || topRightElement.includes(oppositeColorSymbol)) {
                attackingMoves.push(topRightIndexes);
            }
        }

        return attackingMoves;
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

    function getIndexesInDirectionFromSquare(indexes, isWhite, direction) {
        const { row, col } = indexes;

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

    function getLegalMoves(piece, game) {
        let legalMoves = [];

        switch (piece.type) {
            case "pawn":
                legalMoves = getLegalPawnMoves(piece, game);
                break;
            case "knight":
                legalMoves = getLegalKnightMoves(piece, game);
                break;
            case "bishop":
                legalMoves = getLegalBishopMoves(piece, game);
                break;
            case "rook":
                legalMoves = getLegalRookMoves(piece, game);
                break;
            case "queen":
                legalMoves = getLegalQueenMoves(piece, game);
                break;
            case "king":
                legalMoves = getLegalKingMoves(piece, game);
                break;
            default:
                console.error("Invalid piece type.");
                break;
        }

        return legalMoves;
    }

    function getLegalPawnMoves(piece, game) {
        let legalMoves = [];
        const isWhite = piece.color === "white";
        const oppositeColorSymbol = isWhite ? "B" : "W";
        const possiblePinnedMovesIndexes = pieceIsPinned(piece, game);
        let pieceIsPinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            pieceIsPinned = true;
        }

        // check normal front move
        const frontElementIndexes = getIndexesInDirection(piece, "front");
        if (frontElementIndexes == null) return; // if this is null, just do not add the move
        const [frontElementRow, frontElementCol] = frontElementIndexes;
        const frontElementSymbol = game.chessBoard[frontElementRow][frontElementCol];
        if (frontElementSymbol === "s") {
            legalMoves.push([frontElementRow, frontElementCol]);
        }

        // check initial double move
        if (piece.hasMoved) return; // if this is true, do not add the square below
        const doubleFrontEleIndexes = getIndexesInDirectionFromSquare([frontElementRow, frontElementCol], isWhite, "front");
        if (doubleFrontEleIndexes == null) return;
        const [doubleFrontRow, doubleFrontCol] = doubleFrontEleIndexes;
        const doubleFrontSymbol = game.chessBoard[doubleFrontRow][doubleFrontCol];
        if (doubleFrontSymbol === "s") {
            legalMoves.push([doubleFrontRow, doubleFrontCol]);
        }

        // check diagonals
        const [topLeftRow, topLeftCol] = getIndexesInDirection(piece, "top-left");
        let topLeftSymbol;
        if (!([topLeftRow, topLeftCol] == null)) {
            topLeftSymbol = game.chessBoard[topLeftRow][topLeftCol];
            if (topLeftSymbol === "s" || topLeftSymbol.includes(oppositeColorSymbol)) {
                legalMoves.push([topLeftRow, topLeftCol]);
            }
        }

        const [topRightRow, topRightCol] = getIndexesInDirection(piece, "top-right");
        let topRightSymbol;
        if (!([topRightRow, topRightCol] == null)) {
            topRightSymbol = game.chessBoard[topLeftRow][topLeftCol];
            if (topRightSymbol === "s" || topRightSymbol.includes(oppositeColorSymbol)) {
                legalMoves.push([topRightRow, topRightCol]);
            }
        }

        // check en passant
        // get element on left
        const leftElementIndexes = getIndexesInDirection(piece, "left");
        if (leftElementIndexes == null) return;

        const [leftElementRow, leftElementCol] = leftElementIndexes;
        let leftElementSymbol = game.chessBoard[leftElementRow][leftElementCol];
        if (leftElementSymbol !== oppositeColorSymbol + "p") return;


        //first check if the element is pawn of opposite color -> "p"
        const leftPiece = game.pieces.find(p =>
            p.coordinates.equals(new Coordinates(leftElementCol, leftElementRow))
        );

        // check if that piece just jumped
        if (leftPiece && leftPiece.hasDoubleJumped) {//if yes, we can add the field behind him to legal moves
            legalMoves.push(getIndexesInDirection(piece, "top-left"));
        }


        // check en passant
        // get element on left
        const rightElementIndexes = getIndexesInDirection(piece, "left");
        if (rightElementIndexes == null) return;

        const [rightElementRow, rightElementCol] = rightElementIndexes;
        let rightElementSymbol = game.chessBoard[rightElementRow][rightElementCol];
        if (rightElementSymbol !== oppositeColorSymbol + "p") return;


        //first check if the element is pawn of opposite color -> "p"
        const rightPiece = game.pieces.find(p =>
            p.coordinates.equals(new Coordinates(rightElementCol, rightElementRow))
        );

        // check if that piece just jumped
        if (rightPiece && rightPiece.hasDoubleJumped) {//if yes, we can add the field behind him to legal moves
            legalMoves.push(getIndexesInDirection(piece, "top-right"));
        }

    }

    function pieceIsPinned(piece, game) {
        const isWhite = piece.color === "white";
        const sameColor = isWhite ? "white" : "black";
        const king = getPieces({ color: sameColor, type: "king" }, game); // 1 item array
        let possibleMovesDuringPin = [];
        // based on indexes, calculate direction from king to piece
        const [kingRow, kingCol] = king.coordinates.toIndex();
        const [pieceRow, pieceCol] = piece.coordinates.toIndex();
        const rowsDifference = kingRow - pieceRow;
        const colsDifference = kingCol - pieceCol;

        let direction;
        if (rowsDifference > 0 && colsDifference > 0) {
            direction = isWhite ? "top-left" : "bottom-right";
        } else if (rowsDifference > 0 && colsDifference === 0) {
            direction = isWhite ? "front" : "back";
        } else if (rowsDifference > 0 && colsDifference < 0) {
            direction = isWhite ? "top-right" : "bottom-left";
        } else if (rowsDifference === 0 && colsDifference > 0) {
            direction = isWhite ? "left" : "right";
        } else if (rowsDifference === 0 && colsDifference < 0) {
            direction = isWhite ? "right" : "left";
        } else if (rowsDifference < 0 && colsDifference > 0) {
            direction = isWhite ? "bottom-left" : "top-right";
        } else if (rowsDifference < 0 && colsDifference === 0) {
            direction = isWhite ? "back" : "front";
        } else if (rowsDifference < 0 && colsDifference < 0) {
            direction = isWhite ? "bottom-right" : "top-left";
        }

        // in this array we will store piece types which can pin the piece in given direction
        let possiblePieceTypes = [];
        if (["front", "back", "left", "right"].includes(direction)) {
            possiblePieceTypes.push("q");
            possiblePieceTypes.push("r");
        } else if (["top-left", "top-right", "bottom-left", "bottom-right"].includes(direction)) {
            possiblePieceTypes.push("q");
            possiblePieceTypes.push("b");
        }

        // remove the piece on the board temporarily
        const pieceSymbol = game.chessBoard[pieceRow, pieceCol];
        game.chessBoard[pieceRow, pieceCol] = "s";// change it to empty square

        // get king long range moves in given direction -> we will check which opposite piece is at the end, if there is one
        let kingMovesInDirection = getLongRangeMoves([kingRow, kingCol], isWhite, direction, game);
        if (kingMovesInDirection == null || kingMovesInDirection.length === 0) {
            // do not forget to add the piece back to board!
            game.chessBoard[pieceRow, pieceCol] = pieceSymbol;

            return null;
        }

        const lastItemIndexes = kingMovesInDirection.at(-1);
        const lastItemSymbol = game.chessBoard[lastItemIndexes[0]][lastItemIndexes[1]];
        const oppositeColorSymbol = isWhite ? "B" : "W";
        if (!(lastItemSymbol.includes(oppositeColorSymbol))) {// if there is no piece looking through the pice on king
            // we know we are not pinned, return null

            // do not forget to add the piece back to board!
            game.chessBoard[pieceRow, pieceCol] = pieceSymbol;

            return null;
        }

        // otherwise check if the piece is the one which can attack in given direction
        // the string is for example "Wb", how to get the last symbol of the string. 
        if (lastItemSymbol.includes(oppositeColorSymbol) && possiblePieceTypes.includes(lastItemSymbol[lastItemSymbol.length - 1])) {
            possibleMovesDuringPin.push(...kingMovesInDirection);
            possibleMovesDuringPin = possibleMovesDuringPin.filter(item => !(item[0] === pieceRow && item[1] === pieceCol));

            // do not forget to add the piece back to board!
            game.chessBoard[pieceRow, pieceCol] = pieceSymbol;

            return possibleMovesDuringPin;
        }

        // do not forget to add the piece back to board!
        game.chessBoard[pieceRow, pieceCol] = pieceSymbol;
        return null;
    }

    function getLongRangeMoves(currentIndexes, isWhite, direction, game) {
        let legalMoves = [];
        const oppositeColorSymbol = isWhite ? "B" : "W";

        const nextElementIndexes = getIndexesInDirectionFromSquare(currentIndexes, isWhite, direction);
        if (nextElementIndexes == null) {
            return legalMoves;
        }

        const nextElementSymbol = game.chessBoard[nextElementIndexes[0]][nextElementIndexes[1]];
        if (nextElementSymbol === "s") {
            legalMoves.push(nextElementIndexes);
            legalMoves.push(...getLongRangeMoves(nextElementIndexes, isWhite, direction, game));
        } else if (nextElementSymbol.includes(oppositeColorSymbol)) {
            legalMoves.push(nextElementIndexes);
        }

        return legalMoves;
    }

};