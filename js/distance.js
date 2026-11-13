
const DISTANCE_DIRECTIONS = [
    { x:  0, y: -1 },
    { x:  1, y: -1 },
    { x:  1, y:  0 },
    { x:  1, y:  1 },
    { x:  0, y:  1 },
    { x: -1, y:  1 },
    { x: -1, y:  0 },
    { x: -1, y: -1 }
];

function chebyshevDistance(from, to) {
    return Math.max(
        Math.abs(from.x - to.x),
        Math.abs(from.y - to.y)
    );
}

function bfsDistance(board, from, to) {
    const height = board.length;
    const width = board[0]?.length ?? 0;

    if (width === 0 || height === 0) return null;

    function isWalkable(x, y) {
        return (
            x >= 0 &&
            x < width &&
            y >= 0 &&
            y < height &&
            board[y][x] &&
            board[y][x].movement !== "blocked"
        );
    }

    if (!isWalkable(from.x, from.y) || !isWalkable(to.x, to.y)) {
        return null;
    }

    if (from.x === to.x && from.y === to.y) {
        return 0;
    }

    const visited = Array.from(
        { length: height },
        () => Array(width).fill(false)
    );

    const queue = [{ x: from.x, y: from.y, distance: 0 }];
    let head = 0;

    visited[from.y][from.x] = true;

    while (head < queue.length) {
        const current = queue[head++];

        for (const direction of DISTANCE_DIRECTIONS) {
            const x = current.x + direction.x;
            const y = current.y + direction.y;

            if (!isWalkable(x, y) || visited[y][x]) {
                continue;
            }

            const distance = current.distance + 1;

            if (x === to.x && y === to.y) {
                return distance;
            }

            visited[y][x] = true;
            queue.push({ x, y, distance });
        }
    }

    return null;
}

function getDistance(board, from, to, metric) {
    switch (metric) {
        case "chebyshev":
            return chebyshevDistance(from, to);

        case "bfs":
            return bfsDistance(board, from, to);

        default:
            throw new Error(`Unknown distance metric: ${metric}`);
    }
}
