
function createDistanceTestBoard(width, height, blockedFields = []) {
    const board = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
            movement: "arrows",
            mask: 0
        }))
    );

    for (const { x, y } of blockedFields) {
        board[y][x] = {
            movement: "blocked",
            mask: 0
        };
    }

    return board;
}


// Distance from a position to itself
function testBfsSamePosition() {
    const board = createDistanceTestBoard(3, 3);

    const expected = 0;
    const actual = bfsDistance(
        board,
        { x: 1, y: 1 },
        { x: 1, y: 1 }
    );

    return { expected, actual };
}


// Horizontal movement
function testBfsHorizontalDistance() {
    const board = createDistanceTestBoard(5, 3);

    const expected = 4;
    const actual = bfsDistance(
        board,
        { x: 0, y: 1 },
        { x: 4, y: 1 }
    );

    return { expected, actual };
}


// Diagonal movement
function testBfsDiagonalDistance() {
    const board = createDistanceTestBoard(3, 3);

    const expected = 2;
    const actual = bfsDistance(
        board,
        { x: 0, y: 0 },
        { x: 2, y: 2 }
    );

    return { expected, actual };
}


// BFS must find the shortest path around obstacles
function testBfsDetourAroundObstacles() {
    const board = createDistanceTestBoard(5, 3, [
        { x: 2, y: 0 },
        { x: 2, y: 1 }
    ]);

    const expected = 4;
    const actual = bfsDistance(
        board,
        { x: 0, y: 1 },
        { x: 4, y: 1 }
    );

    return { expected, actual };
}


// A complete wall makes the destination unreachable
function testBfsUnreachableDestination() {
    const board = createDistanceTestBoard(3, 3, [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 }
    ]);

    const expected = null;
    const actual = bfsDistance(
        board,
        { x: 0, y: 1 },
        { x: 2, y: 1 }
    );

    return { expected, actual };
}


// Diagonal movement may pass between blocked fields
function testBfsDiagonalCornerCutting() {
    const board = createDistanceTestBoard(2, 2, [
        { x: 1, y: 0 },
        { x: 0, y: 1 }
    ]);

    const expected = 1;
    const actual = bfsDistance(
        board,
        { x: 0, y: 0 },
        { x: 1, y: 1 }
    );

    return { expected, actual };
}


// Directional arrow masks do not affect geometric distance
function testBfsIgnoresArrowMasks() {
    const board = createDistanceTestBoard(3, 1);

    const expected = 2;
    const actual = bfsDistance(
        board,
        { x: 0, y: 0 },
        { x: 2, y: 0 }
    );

    return { expected, actual };
}


// Blocked start or destination fields are invalid
function testBfsBlockedEndpoints() {
    const board = createDistanceTestBoard(3, 3, [
        { x: 0, y: 0 },
        { x: 2, y: 2 }
    ]);

    const expected = [null, null];

    const actual = [
        bfsDistance(board, { x: 0, y: 0 }, { x: 1, y: 1 }),
        bfsDistance(board, { x: 1, y: 1 }, { x: 2, y: 2 })
    ];

    return { expected, actual };
}


TESTS.push(
    {
        suite: "Distance",
        name: "BFS same position",
        description: "Distance to the same position is zero.",
        test: testBfsSamePosition
    },
    {
        suite: "Distance",
        name: "BFS horizontal distance",
        description: "Horizontal movement counts individual steps.",
        test: testBfsHorizontalDistance
    },
    {
        suite: "Distance",
        name: "BFS diagonal distance",
        description: "Diagonal movement is allowed.",
        test: testBfsDiagonalDistance
    },
    {
        suite: "Distance",
        name: "BFS detour around obstacles",
        description: "Finds the shortest path around blocked fields.",
        test: testBfsDetourAroundObstacles
    },
    {
        suite: "Distance",
        name: "BFS unreachable destination",
        description: "Returns null when no path exists.",
        test: testBfsUnreachableDestination
    },
    {
        suite: "Distance",
        name: "BFS diagonal corner-cutting",
        description: "Allows diagonal movement between blocked fields.",
        test: testBfsDiagonalCornerCutting
    },
    {
        suite: "Distance",
        name: "BFS ignores arrow masks",
        description: "Arrow directions do not restrict geometric distance.",
        test: testBfsIgnoresArrowMasks
    },
    {
        suite: "Distance",
        name: "BFS blocked endpoints",
        description: "Returns null if either endpoint is blocked.",
        test: testBfsBlockedEndpoints
    }
);
