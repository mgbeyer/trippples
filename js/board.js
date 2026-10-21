
const BOARD_SIZE = RULESETS.current.board.size;
const ANY = 0xff;

const STARTS = {
    orange: { ...RULESETS.current.players.orange.start },
    blue: { ...RULESETS.current.players.blue.start }
};

function keyOf(x, y) {
    return `${x},${y}`;
}

function isInsideBoard(x, y, size = BOARD_SIZE) {
    return (
        x >= 0 &&
        x < size &&
        y >= 0 &&
        y < size
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
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function createBoard(ruleset = RULESETS.current) {
    validateRuleset(ruleset);

    const size = ruleset.board.size;
    const board = Array.from(
        { length: size },
        () => Array(size).fill(null)
    );

    const specialPositions = new Map();

    function addRole(position, role, player) {
        const key = keyOf(position.x, position.y);

        if (!specialPositions.has(key)) {
            specialPositions.set(key, {
                x: position.x,
                y: position.y,
                roles: [],
                players: []
            });
        }

        const cell = specialPositions.get(key);

        if (!cell.roles.includes(role)) {
            cell.roles.push(role);
        }

        if (player && !cell.players.includes(player)) {
            cell.players.push(player);
        }
    }

    for (const player of ["orange", "blue"]) {
        addRole(ruleset.players[player].start, "start", player);

        const route = ruleset.players[player].route;

        route.forEach((position, index) => {
            const role = index === route.length - 1
                ? "target"
                : "parcours";

            addRole(position, role, player);
        });
    }

    for (const position of ruleset.board.blockedFields) {
        addRole(position, "blocked");
    }

    const combinations = createDirectionCombinations();

    if (combinations.length !== ruleset.board.arrowCombinationCount) {
        throw new Error(
            `Expected ${ruleset.board.arrowCombinationCount} arrow combinations, ` +
            `but generated ${combinations.length}.`
        );
    }

    const deck = shuffle([
        ...combinations,
        ...Array(ruleset.board.anyFieldCount).fill(ANY)
    ]);

    let index = 0;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const key = keyOf(x, y);
            const special = specialPositions.get(key);

            if (special) {
                const blocked = special.roles.includes("blocked");
                const movement = blocked ? "blocked" : "any";

                board[y][x] = {
                    type: getDisplayType(special.roles),
                    roles: [...special.roles],
                    players: [...special.players],
                    movement,
                    mask: blocked ? 0 : ANY
                };

                continue;
            }

            const mask = deck[index++];

            board[y][x] = {
                type: mask === ANY ? "any" : "arrows",
                roles: [],
                players: [],
                movement: mask === ANY ? "any" : "arrows",
                mask
            };
        }
    }

    validateGeneratedBoard(board, ruleset);

    return board;
}

function getDisplayType(roles) {
    if (roles.includes("blocked")) {
        return "blocked";
    }

    // A start may also be the other player's final target.
    if (roles.includes("start")) {
        return "start";
    }

    if (roles.includes("parcours")) {
        return "parcours";
    }

    if (roles.includes("target")) {
        return "target";
    }

    throw new Error(`Unknown special field roles: ${roles.join(", ")}`);
}

function validateRuleset(ruleset) {
    if (!ruleset || !ruleset.board || !ruleset.players) {
        throw new Error("Invalid ruleset: board and players are required.");
    }

    const size = ruleset.board.size;

    if (!Number.isInteger(size) || size <= 0) {
        throw new Error("Invalid ruleset: board size must be a positive integer.");
    }

    if (
        !Number.isInteger(ruleset.board.anyFieldCount) ||
        ruleset.board.anyFieldCount < 0
    ) {
        throw new Error("Invalid ruleset: anyFieldCount must be a non-negative integer.");
    }

    if (!Array.isArray(ruleset.board.blockedFields)) {
        throw new Error("Invalid ruleset: blockedFields must be an array.");
    }

    for (const player of ["orange", "blue"]) {
        const config = ruleset.players[player];

        if (!config || !config.start || !Array.isArray(config.route) ||
            config.route.length === 0) {
            throw new Error(`Invalid ruleset: ${player} needs a start and a non-empty route.`);
        }

        validatePosition(config.start, size, `${player} start`);

        for (const position of config.route) {
            validatePosition(position, size, `${player} route`);
        }
    }

    for (const position of ruleset.board.blockedFields) {
        validatePosition(position, size, "blocked field");
    }

    const specialKeys = new Set();

    function register(position, description) {
        const key = keyOf(position.x, position.y);

        // Overlapping start and target roles are intentional.
        // A blocked field may not overlap any other role.
        if (specialKeys.has(key) && description === "blocked field") {
            throw new Error(`Invalid ruleset: blocked field overlaps another role at ${key}.`);
        }

        if (description !== "blocked field" &&
            ruleset.board.blockedFields.some(
                blocked => keyOf(blocked.x, blocked.y) === key
            )) {
            throw new Error(`Invalid ruleset: ${description} overlaps a blocked field at ${key}.`);
        }

        specialKeys.add(key);
    }

    for (const player of ["orange", "blue"]) {
        register(ruleset.players[player].start, `${player} start`);

        for (const position of ruleset.players[player].route) {
            register(position, `${player} route`);
        }
    }

    for (const position of ruleset.board.blockedFields) {
        register(position, "blocked field");
    }

    const availableCells = size * size - specialKeys.size;
    const expectedArrowCount = ruleset.board.arrowCombinationCount;

    if (availableCells !== expectedArrowCount + ruleset.board.anyFieldCount) {
        throw new Error(
            `Invalid ruleset: ${availableCells} ordinary cells remain, but ` +
            `${expectedArrowCount} arrows and ${ruleset.board.anyFieldCount} ANY fields are configured.`
        );
    }
}

function validatePosition(position, size, description) {
    if (
        !position ||
        !Number.isInteger(position.x) ||
        !Number.isInteger(position.y) ||
        position.x < 0 ||
        position.x >= size ||
        position.y < 0 ||
        position.y >= size
    ) {
        throw new Error(`Invalid ruleset: ${description} has an invalid position.`);
    }
}

function validateGeneratedBoard(board, ruleset) {
    const size = ruleset.board.size;

    if (board.length !== size || board.some(row => row.length !== size)) {
        throw new Error("Generated board has invalid dimensions.");
    }

    const tiles = board.flat();

    if (tiles.some(tile => tile === null)) {
        throw new Error("Generated board contains an unassigned field.");
    }

    const arrowMasks = tiles
        .filter(tile => tile.movement === "arrows")
        .map(tile => tile.mask);

    const uniqueArrowMasks = new Set(arrowMasks);

    if (
        arrowMasks.length !== ruleset.board.arrowCombinationCount ||
        uniqueArrowMasks.size !== arrowMasks.length
    ) {
        throw new Error("Generated board does not contain the expected unique arrow combinations.");
    }

    const anyCount = tiles.filter(
        tile => tile.type === "any"
    ).length;

    if (anyCount !== ruleset.board.anyFieldCount) {
        throw new Error("Generated board has an incorrect number of ordinary ANY fields.");
    }

    const blockedCount = tiles.filter(
        tile => tile.movement === "blocked"
    ).length;

    if (blockedCount !== ruleset.board.blockedFields.length) {
        throw new Error("Generated board has an incorrect number of blocked fields.");
    }
}

function getTile(board, x, y) {
    return isInsideBoard(x, y, board.length)
        ? board[y][x]
        : null;
}
