const BOARD_SIZE = 8;
const ANY = 0xff;


const PARCOURS = new Set([
    "1,1",
    "6,1",
    "1,6",
    "6,6"
]);


const STARTS = {
    orange: {
        x: 4,
        y: 7
    },

    blue: {
        x: 3,
        y: 7
    }
};


function keyOf(x, y) {
    return `${x},${y}`;
}


function isInsideBoard(x, y) {
    return (
        x >= 0 &&
        x < BOARD_SIZE &&
        y >= 0 &&
        y < BOARD_SIZE
    );
}


function createDirectionCombinations() {
    const combinations = [];

    for (let i = 0; i < 8; i++) {
        for (let j = i + 1; j < 8; j++) {
            for (let k = j + 1; k < 8; k++) {
                combinations.push(
                    (1 << i) |
                    (1 << j) |
                    (1 << k)
                );
            }
        }
    }

    return combinations;
}


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];
    }

    return array;
}


function createBoard() {
    const board = Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(null)
    );

    const deck = shuffle([
        ...createDirectionCombinations(),
        ANY,
        ANY
    ]);

    let index = 0;

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const key = keyOf(x, y);

            if (PARCOURS.has(key)) {
                board[y][x] = {
                    type: "parcours",
                    mask: ANY
                };

            } else if (
                (x === 3 || x === 4) &&
                y === 7
            ) {
                board[y][x] = {
                    type: "start",
                    mask: ANY
                };

            } else {
                const mask = deck[index++];

                board[y][x] = {
                    type: mask === ANY
                        ? "any"
                        : "arrows",
                    mask: mask
                };
            }
        }
    }

    return board;
}


function getTile(board, x, y) {
    return isInsideBoard(x, y)
        ? board[y][x]
        : null;
}