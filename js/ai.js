// Default search depth: the AI looks ahead four individual moves (plies).
// This provides a balance between playing strength and calculation time.
const AI_DEFAULT_DEPTH = 4;


// Creates an independent game state for the AI search.
// Player objects are copied, while the board is shared because it is immutable.
// This prevents simulated moves from modifying the actual game.
function cloneSearchState(state) {
    return {
        board: state.board,
        players: {
            orange: { ...state.players.orange },
            blue: { ...state.players.blue }
        },
        currentPlayer: state.currentPlayer,
        gameOver: state.gameOver,
        winner: state.winner
    };
}


// Applies a move to a simulated game state and returns the resulting state.
// It updates the player's position and route progress, checks for victory,
// switches the active player, and checks whether that player can still move.
// This allows Minimax to explore possible moves without changing the real game.
function applySearchMove(state, move, ruleset) {
    const next = cloneSearchState(state);
    const player = state.currentPlayer;
    const opponent = getOpponentName(player);

    const me = next.players[player];

    me.x = move.x;
    me.y = move.y;

    const route = ruleset.players[player].route;
    const goal = route[me.reached];

    if (
        goal &&
        me.x === goal.x &&
        me.y === goal.y
    ) {
        me.reached++;

        if (me.reached >= route.length) {
            next.gameOver = true;
            next.winner = player;
            return next;
        }
    }

    next.currentPlayer = opponent;

    // As in Game.move(), a player who has no legal move loses.
    if (getLegalMoves(next, opponent).length === 0) {
        next.gameOver = true;
        next.winner = player;
    }

    return next;
}


// Creates a terminal state in which the current player has no legal moves.
// The opponent is declared the winner.
// This ensures that positions with no available moves are evaluated as losses.
function getTerminalStateForNoMoves(state) {
    return {
        ...state,
        gameOver: true,
        winner: getOpponentName(state.currentPlayer)
    };
}


// Recursively searches possible future moves using the Minimax algorithm.
// The perspective player tries to maximize the score, while the opponent
// tries to minimize it. Alpha-beta pruning skips branches that cannot
// influence the final decision, reducing the number of positions examined.
// The returned score estimates how favorable the resulting position is.
function minimax(
    state,
    ruleset,
    perspectivePlayer,
    depth,
    alpha,
    beta
) {
    if (state.gameOver) {
        return evaluatePosition(
            state,
            ruleset,
            perspectivePlayer
        );
    }

    const moves = getLegalMoves(
        state,
        state.currentPlayer
    );

    if (moves.length === 0) {
        const terminalState = getTerminalStateForNoMoves(state);

        return evaluatePosition(
            terminalState,
            ruleset,
            perspectivePlayer
        );
    }

    if (depth <= 0) {
        return evaluatePosition(
            state,
            ruleset,
            perspectivePlayer
        );
    }

    const maximizing =
        state.currentPlayer === perspectivePlayer;

    if (maximizing) {
        let bestScore = -Infinity;

        for (const move of moves) {
            const next = applySearchMove(
                state,
                move,
                ruleset
            );

            const score = minimax(
                next,
                ruleset,
                perspectivePlayer,
                depth - 1,
                alpha,
                beta
            );

            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, bestScore);

            if (beta <= alpha) {
                break;
            }
        }

        return bestScore;
    }

    // minimizing
    let bestScore = Infinity;

    for (const move of moves) {
        const next = applySearchMove(
            state,
            move,
            ruleset
        );

        const score = minimax(
            next,
            ruleset,
            perspectivePlayer,
            depth - 1,
            alpha,
            beta
        );

        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, bestScore);

        if (beta <= alpha) {
            break;
        }
    }

    return bestScore;
}


// Determines the best move for the current player.
// It evaluates every legal first move by running Minimax on the resulting
// position, then selects the move with the highest score.
// Alpha-beta pruning is shared across the root moves to reduce search work.
// Returns the selected move and its score, or null if no move is possible.
function findBestMove(game, {
    depth = AI_DEFAULT_DEPTH
} = {}) {
    if (game.gameOver) {
        return null;
    }

    if (!Number.isInteger(depth) || depth < 1) {
        throw new Error("AI search depth must be a positive integer.");
    }

    const state = game.getState();
    const ruleset = game.ruleset;
    const perspectivePlayer = state.currentPlayer;

    const moves = getLegalMoves(
        state,
        perspectivePlayer
    );

    if (moves.length === 0) {
        return null;
    }

    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of moves) {
        const next = applySearchMove(
            state,
            move,
            ruleset
        );

        const score = minimax(
            next,
            ruleset,
            perspectivePlayer,
            depth - 1,
            alpha,
            beta
        );

        if (score > bestScore) {
            bestScore = score;
            bestMove = { ...move };
        }

        alpha = Math.max(alpha, bestScore);
    }

    return {
        move: bestMove,
        score: bestScore
    };
}