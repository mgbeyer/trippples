const TESTS = [];


function createTestState(
    orange,
    blue,
    blueTileMask = ANY
) {
    const board = Array.from(
        { length: BOARD_SIZE },
        () => Array.from(
            { length: BOARD_SIZE },
            () => ({
                type: "test",
                mask: ANY
            })
        )
    );

    board[blue.y][blue.x] = {
        type: "test",
        mask: blueTileMask
    };

    return {
        board,

        players: {
            orange: {
                ...orange
            },

            blue: {
                ...blue
            }
        }
    };
}


function testStartPosition() {
    const state = createTestState(
        { x: 4, y: 7 },
        { x: 3, y: 7 }
    );

    const actual = getLegalMoves(
        state,
        "orange"
    );

    const expected = [
        { x: 3, y: 6 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 7 }
    ];

    return {
        expected,
        actual
    };
}


function testOpponentTileControlsDirections() {
    const state = createTestState(
        { x: 4, y: 4 },
        { x: 3, y: 3 },
        1 << 0
    );

    const actual = getLegalMoves(
        state,
        "orange"
    );

    const expected = [
        { x: 4, y: 3 }
    ];

    return {
        expected,
        actual
    };
}


function testOpponentTileIsNotEnterable() {
    const state = createTestState(
        { x: 4, y: 4 },
        { x: 3, y: 3 },
        ANY
    );

    const actual = getLegalMoves(
        state,
        "orange"
    ).some(
        p => p.x === 3 && p.y === 3
    );

    const expected = false;

    return {
        expected,
        actual
    };
}


function testBoardBoundary() {
    const state = createTestState(
        { x: 0, y: 0 },
        { x: 7, y: 7 },
        ANY
    );

    const actual = getLegalMoves(
        state,
        "orange"
    );

    const expected = [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
    ];

    return {
        expected,
        actual
    };
}


function testNoLegalMove() {
    const state = createTestState(
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        1 << 7
    );

    const actual = getLegalMoves(
        state,
        "orange"
    ).length;

    const expected = 0;

    return {
        expected,
        actual
    };
}


TESTS.push(
    {
        suite: "Rules",
        name: "Start position",
        description:
            "Checks the legal moves for Orange at the initial position.",
        test: testStartPosition
    },
    {
        suite: "Rules",
        name: "Opponent tile controls directions",
        description:
            "Checks that the opponent tile determines the available direction.",
        test: testOpponentTileControlsDirections
    },
    {
        suite: "Rules",
        name: "Opponent tile is not enterable",
        description:
            "Checks that a player cannot move onto the opponent.",
        test: testOpponentTileIsNotEnterable
    },
    {
        suite: "Rules",
        name: "Board boundary",
        description:
            "Checks that moves outside the board are excluded.",
        test: testBoardBoundary
    },
    {
        suite: "Rules",
        name: "No legal move",
        description:
            "Checks that a blocked player has no legal moves.",
        test: testNoLegalMove
    }
);