/**
   A codeheart.js remake of the game 1010.

   (c) 2016 james r. wilcox
*/

///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //


// the board is a BOARD_SIZE.x by BOARD_SIZE.y rectangle of tiles
var BOARD_SIZE = makeVec(10, 10);

// position of the top left corner of the board
var BOARD_OFFSET = multVec(makeVec(screenWidth, screenHeight), makeVec(0.25, 0.025));

var TILE_SIZE = makeVec(80, 80);

// pieces yet to be placed are displayed at PIECES_OFFSET.
var PIECES_OFFSET = addVec(multVec(makeVec(screenWidth, screenHeight), makeVec(-0.1, 0.025)),
                           boardPosition(0, BOARD_SIZE.y));

var WHITE = makeColor(1, 1, 1);

// number of pieces generated per turn.
var NUM_PIECES = 3;

// these are all the possible pieces. note that each rotation is
// stored separately, but in the future these may be computed automatically.
var PIECES = [{name: "square-2",
               elements: [makeVec(0,0), makeVec(0,1),
                          makeVec(1,0), makeVec(1,1)]},
              {name: "square-2",
               elements: [makeVec(0,0), makeVec(0,1), makeVec(0,2),
                          makeVec(1,0), makeVec(1,1), makeVec(1,2),
                          makeVec(2,0), makeVec(2,1), makeVec(2,2)]},
              {name: "one",
               elements: [makeVec(0,0)]},

              {name: "two-h",
               elements: [makeVec(0,0), makeVec(1,0)]},
              {name: "two-v",
               elements: [makeVec(0,0), makeVec(0,1)]},

              {name: "three-h",
               elements: [makeVec(0,0), makeVec(1,0), makeVec(2,0)]},
              {name: "three-v",
               elements: [makeVec(0,0), makeVec(0,1), makeVec(0,2)]},

              {name: "four-h",
               elements: [makeVec(0,0), makeVec(1,0), makeVec(2,0), makeVec(3,0)]},
              {name: "four-v",
               elements: [makeVec(0,0), makeVec(0,1), makeVec(0,2), makeVec(0,3)]},


              {name: "five-h",
               elements: [makeVec(0,0), makeVec(1,0), makeVec(2,0),
                          makeVec(3,0), makeVec(4,0)]},
              {name: "five-v",
               elements: [makeVec(0,0), makeVec(0,1), makeVec(0,2),
                          makeVec(0,3), makeVec(0,4)]},

              {name: "ell-1",
               elements: [makeVec(0,0), makeVec(1,0), makeVec(2,0),
                          makeVec(0,1), makeVec(0,2)]},
              {name: "ell-2",
               elements: [makeVec(0,0), makeVec(1,0), makeVec(2,0),
                          makeVec(2,1), makeVec(2,2)]},
              {name: "ell-3",
               elements: [makeVec(0,2), makeVec(1,2), makeVec(2,0),
                          makeVec(2,1), makeVec(2,2)]},
              {name: "ell-4",
               elements: [makeVec(2,2), makeVec(1,2), makeVec(0,0),
                          makeVec(0,1), makeVec(0,2)]},


];

// the maximum width or height of any piece.
// TODO: should be computed automatically.
var MAX_PIECE_SIZE = 5;

///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

// array representing state of the game. each element is
// undefined if no tile is present.
var board = makeArray(BOARD_SIZE.x, BOARD_SIZE.y);

// array of pieces for the current turn. pieces that are yet
// to be placed are represented by non-undefined elements.
var pieces = makeArray(NUM_PIECES);

// pieces are placed via drag and drop. during placement, the
// drag* variables are defined.

// current position of mouse
var dragPos;

// piece being dragged
var dragPiece;

// delta between position of upper left corner of piece and
// the mouse. this is computed when the piece is first picked up
// and is constant throughout the drag.
var dragOffset;

// index of piece from the pieces array when it was picked up.
// used to put the piece back if the drag is canceled
// (eg, by dropping the piece outside the board)
var dragIndex;

var score = 0;

///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

function onSetup() {

}

function onTick() {
    clearRectangle(0, 0, screenWidth, screenHeight);

    doTurn();

    drawScore();
    drawBoard();
    drawPieces();

    drawDrag();
}

function onTouchStart(x, y) {
    var v = makeVec(x,y);
    var i = getPieceUnder(v);

    if (i !== undefined && pieces[i] !== undefined) {
        dragPos = v;
        dragPiece = pieces[i];
        dragOffset = subVec(piecePosition(i), v);
        dragIndex = i;
        pieces[i] = undefined;
    }
}

function onTouchMove(x, y) {
    if (dragPos !== undefined) {
        dragPos = makeVec(x,y);
    }
}

function onTouchEnd(x,y) {
    if (dragPos !== undefined) {
        var v = makeVec(x,y);
        var screen_pos = addVec(v, dragOffset);
        var board_pos = getBoardEltUnder(screen_pos);
        if (board_pos !== undefined && canBeDropped(dragPiece, board_pos)) {
            drop(dragPiece, board_pos);
            cancel();
        } else {
            pieces[dragIndex] = dragPiece;
        }
        dragPos = undefined;
        dragPiece = undefined;
        dragOffset = undefined;
        dragIndex = undefined;
    }
}


///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //

function generatePiece() {
    return PIECES[randomInteger(0, PIECES.length - 1)];
}

function generatePieces() {
    for (var i = 0; i < NUM_PIECES; i++) {
        pieces[i] = generatePiece();
    }
}

function allUndefined(a) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== undefined) {
            return false;
        }
    }
    return true;
}

function doTurn() {
    if (allUndefined(pieces) && dragPos === undefined) {
        generatePieces();
    }
}

function boardPosition(i, j) {
    return makeVec(BOARD_OFFSET.x + i * TILE_SIZE.x,
                   BOARD_OFFSET.y + j * TILE_SIZE.y);
}

function drawTile(pos, color) {
    if (color === undefined) {
        color = WHITE;
    }
    var width = TILE_SIZE.x;
    var height = TILE_SIZE.y;

    fillRectangle(pos.x, pos.y, width, height, color);
}

function drawScore() {
    fillText(score.toString(),
             BOARD_OFFSET.x / 2,
             BOARD_OFFSET.y + (BOARD_SIZE.y / 2) * TILE_SIZE.y,
             WHITE,
             "40pt arial",
             "center",
             "middle");
}

function drawBoard() {
    var ul = boardPosition(0,0);
    strokeRectangle(ul.x, ul.y,
                    BOARD_SIZE.x * TILE_SIZE.x, BOARD_SIZE.y * TILE_SIZE.y,
                    WHITE, 1);

    for (var i = 0; i <= BOARD_SIZE.x; i++) {
        var start = boardPosition(i, 0);
        var end = boardPosition(i, BOARD_SIZE.y);
        strokeLine(start.x, start.y, end.x, end.y, WHITE, 1);
    }

    for (var i = 0; i <= BOARD_SIZE.y; i++) {
        var start = boardPosition(0, i);
        var end = boardPosition(BOARD_SIZE.x, i);
        strokeLine(start.x, start.y, end.x, end.y, WHITE, 1);
    }


    for (var i = 0; i < BOARD_SIZE.x; i++) {
        for (var j = 0; j < BOARD_SIZE.y; j++) {
            if (board[i][j] !== undefined) {
                drawTile(boardPosition(i, j));
            }
        }
    }
}

function makeVec(x, y) {
    return {x:x, y:y};
}

function addVec(u, v) {
    return makeVec(u.x + v.x, u.y + v.y);
}

function subVec(u, v) {
    return makeVec(u.x - v.x, u.y - v.y);
}


function scaleVec(alpha, v) {
    return makeVec(alpha * v.x, alpha * v.y);
}

function multVec(u, v) {
    return makeVec(u.x * v.x, u.y * v.y);
}

function piecePosition(i) {
    return addVec(PIECES_OFFSET, makeVec(i * TILE_SIZE.x * (MAX_PIECE_SIZE + 1), 0));
}

function drawPiece(pos, piece) {
    for (var i = 0; i < piece.elements.length; i++) {
        drawTile(addVec(pos, multVec(TILE_SIZE, piece.elements[i])));
    }
}

function drawPieces() {
    for (var i = 0; i < pieces.length; i++) {
        if (pieces[i] !== undefined) {
            drawPiece(piecePosition(i), pieces[i]);
        }
    }
}

function makeRectangle(p, w, h) {
    return {pos:p, width:w, height:h};
}

function inRectangle(v, rect) {
    return rect.pos.x <= v.x && v.x <= rect.pos.x + rect.width &&
        rect.pos.y <= v.y && v.y <= rect.pos.y + rect.height;
}

function getPieceUnder(pos) {
    for (var i = 0; i < pieces.length; i++) {
        var bb = makeRectangle(piecePosition(i),
                               TILE_SIZE.x * MAX_PIECE_SIZE,
                               TILE_SIZE.y * MAX_PIECE_SIZE);
        if (inRectangle(pos, bb)) return i;
    }
    return undefined;
}

function drawDrag() {
    if (dragPos !== undefined) {
        drawPiece(addVec(dragPos, dragOffset), dragPiece);
    }
}

function getBoardEltUnder(pos) {
    for (var i = 0; i < BOARD_SIZE.x; i++) {
        for (var j = 0; j < BOARD_SIZE.y; j++) {
            var bb = makeRectangle(boardPosition(i - 0.5, j - 0.5), TILE_SIZE.x, TILE_SIZE.y);
            if (inRectangle(pos, bb)) return makeVec(i, j);
        }
    }
    return undefined;
}

function onBoard(pos) {
    return inRectangle(pos, makeRectangle(makeVec(0, 0), BOARD_SIZE.x - 1, BOARD_SIZE.y - 1));
}

function occupied(pos) {
    return board[pos.x][pos.y] !== undefined;
}

function canBeDropped(piece, pos) {
    for (var i = 0; i < piece.elements.length; i++) {
        var tile = addVec(pos, piece.elements[i]);
        if (!onBoard(tile) || occupied(tile)) {
            return false;
        }
    }
    return true;
}

function drop(piece, pos) {
    for (var i = 0; i < piece.elements.length; i++) {
        var tile = addVec(pos, piece.elements[i]);
        board[tile.x][tile.y] = true;
    }
}

function cancel() {
    var full_cols = makeArray(BOARD_SIZE.x);
    for (var i = 0; i < BOARD_SIZE.x; i++) {
        full_cols[i] = true;
        for (var j = 0; j < BOARD_SIZE.y; j++) {
            if (board[i][j] === undefined) {
                full_cols[i] = false;
                break;
            }
        }
    }

    var full_rows = makeArray(BOARD_SIZE.y);
    for (var j = 0; j < BOARD_SIZE.y; j++) {
        full_rows[j] = true;
        for (var i = 0; i < BOARD_SIZE.x; i++) {
            if (board[i][j] === undefined) {
                full_rows[j] = false;
                break;
            }
        }
    }

    for (var i = 0; i < BOARD_SIZE.x; i++) {
        if (full_cols[i]) {
            score++;
            for (var j = 0; j < BOARD_SIZE.y; j++) {
                board[i][j] = undefined;
            }
        }
    }

    for (var j = 0; j < BOARD_SIZE.y; j++) {
        if (full_rows[j]) {
            score++;
            for (var i = 0; i < BOARD_SIZE.x; i++) {
                board[i][j] = undefined;
            }
        }
    }
}
