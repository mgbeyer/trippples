function createGameTestBoard() {
    return Array.from(
        { length: BOARD_SIZE },
        () => Array.from(
            { length: BOARD_SIZE },
            () => ({
                type: "test",
                mask: ANY
            })
        )
    );
}


function testPlayerSwitch() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.players = {
        orange: {
            x: 4,
            y: 7,
            reached: 0
        },

        blue: {
            x: 3,
            y: 7,
            reached: 0
        }
    };

    game.currentPlayer = "orange";

    game.move(
        { x: 4, y: 7 },
        { x: 5, y: 7 }
    );

    const actual = game.getCurrentPlayer();
    const expected = "blue";

    return {
        expected,
        actual
    };
}


function testGoalProgress() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.players = {
        orange: {
            x: 5,
            y: 7,
            reached: 0
        },

        blue: {
            x: 3,
            y: 7,
            reached: 0
        }
    };

    game.currentPlayer = "orange";

    game.move(
        { x: 5, y: 7 },
        { x: 6, y: 6 }
    );

    const actual = game.getPlayerState(
        "orange"
    ).reached;

    const expected = 1;

    return {
        expected,
        actual
    };
}


function testFinalGoalWinsGame() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.players = {
        orange: {
            x: 4,
            y: 7,
            reached: 4
        },

        blue: {
            x: 0,
            y: 0,
            reached: 0
        }
    };

    game.currentPlayer = "orange";

    const result = game.move(
        { x: 4, y: 7 },
        { x: 3, y: 7 }
    );

    const actual = {
        gameOver: game.gameOver,
        winner: game.winner,
        won: result.won
    };

    const expected = {
        gameOver: true,
        winner: "orange",
        won: true
    };

    return {
        expected,
        actual
    };
}


function testNoLegalMoveWinsForOpponent() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.players = {
        orange: {
            x: 2,
            y: 2,
            reached: 0
        },

        blue: {
            x: 0,
            y: 0,
            reached: 0
        }
    };

    game.board[0][0] = {
        type: "test",
        mask: ANY
    };

    game.board[1][2] = {
        type: "test",
        mask: 1 << 7
    };

    game.currentPlayer = "orange";

    game.move(
        { x: 2, y: 2 },
        { x: 2, y: 1 }
    );

    const actual = {
        gameOver: game.gameOver,
        winner: game.winner
    };

    const expected = {
        gameOver: true,
        winner: "orange"
    };

    return {
        expected,
        actual
    };
}


function testUndo() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.players = {
        orange: {
            x: 4,
            y: 7,
            reached: 0
        },

        blue: {
            x: 3,
            y: 7,
            reached: 0
        }
    };

    game.currentPlayer = "orange";

    game.move(
        { x: 4, y: 7 },
        { x: 5, y: 7 }
    );

    game.undo();

    const actual = {
        orange: game.getPlayerPosition("orange"),
        currentPlayer: game.getCurrentPlayer()
    };

    const expected = {
        orange: {
            x: 4,
            y: 7
        },
        currentPlayer: "orange"
    };

    return {
        expected,
        actual
    };
}


function getRelevantGameState(game) {
    return {
        players: structuredClone(game.players),
        currentPlayer: game.getCurrentPlayer(),
        gameOver: game.gameOver,
        winner: game.winner,
        historyLength: game.history.length
    };
}


function testWrongPiece() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.currentPlayer = "orange";

    const before = getRelevantGameState(game);

    const result = game.move(
        { x: 3, y: 7 },
        { x: 4, y: 6 }
    );

    const actual = {
        result,
        state: getRelevantGameState(game)
    };

    const expected = {
        result: {
            ok: false,
            reason: "wrong-piece"
        },
        state: before
    };

    return { expected, actual };
}


function testIllegalMove() {
    const game = new Game();

    game.board = createGameTestBoard();

    const before = getRelevantGameState(game);

    const result = game.move(
        { x: 4, y: 7 },
        { x: 0, y: 0 }
    );

    const actual = {
        result,
        state: getRelevantGameState(game)
    };

    const expected = {
        result: {
            ok: false,
            reason: "illegal-move"
        },
        state: before
    };

    return { expected, actual };
}


function testMoveAfterGameOver() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.gameOver = true;
    game.winner = "blue";

    const before = getRelevantGameState(game);

    const result = game.move(
        { x: 4, y: 7 },
        { x: 5, y: 7 }
    );

    const actual = {
        result,
        state: getRelevantGameState(game)
    };

    const expected = {
        result: {
            ok: false,
            reason: "game-over"
        },
        state: before
    };

    return { expected, actual };
}


function testCanUndoInitiallyFalse() {
    const game = new Game();

    const expected = false;
    const actual = game.canUndo();

    return { expected, actual };
}

function testCanUndoAfterMove() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.move(
        { x: 4, y: 7 },
        { x: 5, y: 7 }
    );

    const expected = true;
    const actual = game.canUndo();

    return { expected, actual };
}


function testCanUndoAfterUndo() {
    const game = new Game();

    game.board = createGameTestBoard();

    game.move(
        { x: 4, y: 7 },
        { x: 5, y: 7 }
    );

    game.undo();

    const expected = false;
    const actual = game.canUndo();

    return { expected, actual };
}

function testUndoAfterNewGame() {
    const game = new Game();
    game.board = createGameTestBoard();

    game.move({ x: 4, y: 7 }, { x: 5, y: 7 });
    game.newGame();

    const expected = false;
    const actual = game.canUndo();

    return { expected, actual };
}

function testUndoAfterWinningMove() {
    const game = new Game();
    game.board = createGameTestBoard();

    // Orange is one move away from its final goal.
    game.players.orange = { x: 4, y: 7, reached: 4 };
    game.players.blue = { x: 2, y: 6, reached: 0 };
    game.currentPlayer = "orange";

    const result = game.move(
        { x: 4, y: 7 },
        { x: 3, y: 7 }
    );

    const expected = {
        ok: true,
        won: true,
        gameOver: true,
        canUndo: true
    };

    const actual = {
        ok: result.ok,
        won: result.won,
        gameOver: game.gameOver,
        canUndo: game.canUndo()
    };

    return { expected, actual };
}

function testNewGameAfterGameOver() {
    const game = new Game();

    game.gameOver = true;
    game.winner = "orange";

    game.newGame();

    const expected = {
        gameOver: false,
        winner: null,
        canUndo: false
    };

    const actual = {
        gameOver: game.gameOver,
        winner: game.winner,
        canUndo: game.canUndo()
    };

    return { expected, actual };
}


function testUndoAfterMultipleMoves() {
    const game = new Game();
    game.board = createGameTestBoard();

    game.move({ x: 4, y: 7 }, { x: 5, y: 7 });
    game.move({ x: 3, y: 7 }, { x: 2, y: 7 });

    const undoSucceeded = game.undo();

    const expected = {
        undoSucceeded: true,
        currentPlayer: "blue",
        orangePosition: { x: 5, y: 7 },
        canUndo: true
    };

    const actual = {
        undoSucceeded,
        currentPlayer: game.getCurrentPlayer(),
        orangePosition: game.getPlayerPosition("orange"),
        canUndo: game.canUndo()
    };

    return { expected, actual };
}

TESTS.push(
    {
        suite: "Game",
        name: "Player switch",
        description:
            "Checks that the turn changes to the other player after a valid move.",
        test: testPlayerSwitch
    },

    {
        suite: "Game",
        name: "Goal progress",
        description:
            "Checks that reaching the next goal advances the player's progress.",
        test: testGoalProgress
    },

    {
        suite: "Game",
        name: "Final goal wins game",
        description:
            "Checks that reaching the fifth and final goal ends the game.",
        test: testFinalGoalWinsGame
    },

    {
        suite: "Game",
        name: "No legal move wins for opponent",
        description:
            "Checks that a player with no legal move loses the game.",
        test: testNoLegalMoveWinsForOpponent
    },

    {
        suite: "Game",
        name: "Undo",
        description:
            "Checks that undo restores the previous player position and turn.",
        test: testUndo
    },

    {
        suite: "Game",
        name: "Can undo initially",
        description:
            "Checks that undo is unavailable before any move has been made.",
        test: testCanUndoInitiallyFalse
    },

    {
        suite: "Game",
        name: "Can undo after move",
        description:
            "Checks that undo becomes available after a valid move.",
        test: testCanUndoAfterMove
    },

    {
        suite: "Game",
        name: "Can undo after undo",
        description:
            "Checks that undo becomes unavailable again after undoing the only move.",
        test: testCanUndoAfterUndo
    },

    {
        suite: "Game",
        name: "Wrong piece rejected",
        description:
            "Checks that moving the opponent's piece is rejected without changing the game state.",
        test: testWrongPiece
    },

    {
        suite: "Game",
        name: "Illegal move rejected",
        description:
            "Checks that an illegal destination is rejected without changing the game state.",
        test: testIllegalMove
    },

    {
        suite: "Game",
        name: "Move after game over rejected",
        description:
            "Checks that moves are rejected after the game has ended without changing the game state.",
        test: testMoveAfterGameOver
    },

    {
        suite: "Game",
        name: "Undo after new game",
        description: "A new game clears the previous undo history.",
        test: testUndoAfterNewGame
    },
    {
        suite: "Game",
        name: "Undo after winning move",
        description: "A winning move can still be undone.",
        test: testUndoAfterWinningMove
    },
    {
        suite: "Game",
        name: "New game after game over",
        description: "A new game resets the finished game state.",
        test: testNewGameAfterGameOver
    },
    {
        suite: "Game",
        name: "Undo after multiple moves",
        description: "Undo restores the previous state and preserves earlier history.",
        test: testUndoAfterMultipleMoves
    }

);