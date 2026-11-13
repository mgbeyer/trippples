
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
/*
    x=0  1  2
y=0   .  .  .
y=1   .  S  .
y=2   .  .  .

S = Start and Goal
. = Free field
*/
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
/*
    x=0  1  2  3  4
y=0   .  .  .  .  .
y=1   S  .  .  .  G
y=2   .  .  .  .  .

S = Start
G = Goal
. = Free field
*/
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
/*
    x=0  1  2
y=0   S  .  .
y=1   .  .  .
y=2   .  .  G

S = Start
G = Goal
. = Free field
*/
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
/*
    x=0  1  2  3  4  5  6
y=0   S  .  .  X  .  .  G
y=1   .  .  .  X  .  .  .
y=2   .  .  .  X  .  .  .
y=3   .  .  .  X  .  .  .
y=4   .  .  .  X  .  .  .
y=5   .  .  .  X  .  .  .
y=6   .  .  .  .  .  .  .

S = Start
G = Goal
X = Blocked
. = Free field
*/
function testBfsDetourAroundObstacles() {
    const board = createDistanceTestBoard(7, 7, [
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 3, y: 5 }
    ]);

    const expected = 12;    // direct distance: 6
    const actual = bfsDistance(
        board,
        { x: 0, y: 0 },
        { x: 6, y: 0 }
    );

    return { expected, actual };
}

// A complete wall makes the destination unreachable
/*
    x=0  1  2
y=0   .  X  .
y=1   S  X  G
y=2   .  X  .

S = Start
G = Goal
X = Blocked
. = Free field
*/
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
/*
    x=0  1
y=0   S  X
y=1   X  G

S = Start
G = Goal
X = Blocked
*/
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
/*
    x=0  1  2
y=0   S  .  G

S = Start
G = Goal
. = Free field


bfsDistance() returns 2, because it deliberately ignores directional arrow masks. 
It considers only whether fields are blocked or traversable.

Why is that intentional?

The BFS distance is used by the AI evaluator as a geometric estimate of how far a player is from their next objective. Actual legal moves are calculated separately by getLegalMoves(), which does respect arrow masks.

So the test establishes that:
- getLegalMoves() must respect directional restrictions.
- bfsDistance() must ignore directional restrictions and account only for obstacles.
In short: even though the arrows on this test board permit no moves, the geometric distance between the two positions is still two.
*/
function testBfsIgnoresArrowMasks() {
    // A mask of 0 means that no movement direction is permitted by the arrow rules.
    const board = createDistanceTestBoard(3, 1, [], {
        movement: "arrows",
        mask: 0
    });

    const expected = 2;
    const actual = bfsDistance(
        board,
        { x: 0, y: 0 },
        { x: 2, y: 0 }
    );

    return { expected, actual };
}


// Blocked start or destination fields are invalid
/*
    x=0  1  2
y=0   X  .  .
y=1   .  .  .
y=2   .  .  X

X = Blocked
. = Free field

First test:  Start at (0,0), Goal at (1,1)
Second test: Start at (1,1), Goal at (2,2)
*/
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
