const DIRECTIONS = [
    { x:  0, y: -1 }, // N
    { x:  1, y: -1 }, // NE
    { x:  1, y:  0 }, // E
    { x:  1, y:  1 }, // SE
    { x:  0, y:  1 }, // S
    { x: -1, y:  1 }, // SW
    { x: -1, y:  0 }, // W
    { x: -1, y: -1 }  // NW
];


function getOpponentName(player) {
    return player === "orange"
        ? "blue"
        : "orange";
}

function getLegalMoves(state, player) {
    const me = state.players[player];
    const opponent = state.players[getOpponentName(player)];

    const tile = getTile(
        state.board,
        opponent.x,
        opponent.y
    );

    if (!tile) {
        return [];
    }

    const moves = [];

    for (let i = 0; i < DIRECTIONS.length; i++) {
        if (
            tile.movement !== "any" &&
            !(tile.mask & (1 << i))
        ) {
            continue;
        }

        const x = me.x + DIRECTIONS[i].x;
        const y = me.y + DIRECTIONS[i].y;

        if (!isInsideBoard(x, y, state.board.length)) {
            continue;
        }

        // Players may not occupy the same field.
        if (x === opponent.x && y === opponent.y) {
            continue;
        }

        const destination = getTile(state.board, x, y);

        if (!destination || destination.movement === "blocked") {
            continue;
        }

        moves.push({ x, y });
    }

    return moves;
}
