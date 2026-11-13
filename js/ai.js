
const AI_DEFAULT_DEPTH = 4;

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

function getTerminalStateForNoMoves(state) {
    return {
        ...state,
        gameOver: true,
        winner: getOpponentName(state.currentPlayer)
    };
}

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
