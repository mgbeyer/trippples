
const AI_WIN_SCORE = 10000;

function getObjectivePenalty(reached, routeLength) {
    // Classic Rules have only a final target, not a sequence
    // of intermediate objectives.
    if (routeLength <= 1) {
        return 0;
    }

    // Penalty used by the original Amiga WayToGo() heuristic.
    switch (reached) {
        case 0: return 18;
        case 1: return 13;
        case 2: return 8;
        case 3: return 3;
        default: return 0;
    }
}

function getRemainingWork(state, ruleset, player) {
    const playerState = state.players[player];
    const route = ruleset.players[player].route;
    const reached = playerState.reached;
    const goal = route[reached];

    if (!goal) {
        throw new Error(
            `Cannot evaluate remaining work for ${player}: ` +
            `no current objective (reached: ${reached}).`
        );
    }

    const distance = getDistance(
        state.board,
        playerState,
        goal,
        ruleset.evaluator.distance
    );

    if (distance === null) {
        throw new Error(
            `Objective for ${player} is unreachable on the board.`
        );
    }

    return distance + getObjectivePenalty(reached, route.length);
}

function evaluateWayToGo(state, ruleset, perspectivePlayer) {
    if (state.gameOver) {
        if (!state.winner) return 0;

        return state.winner === perspectivePlayer
            ? AI_WIN_SCORE
            : -AI_WIN_SCORE;
    }

    const opponent = getOpponentName(perspectivePlayer);

    const ownRemainingWork = getRemainingWork(
        state,
        ruleset,
        perspectivePlayer
    );

    const opponentRemainingWork = getRemainingWork(
        state,
        ruleset,
        opponent
    );

    return opponentRemainingWork - ownRemainingWork;
}

// Rulesets select an evaluator by its registered type.
const EVALUATORS = {
    wayToGo: evaluateWayToGo
};

function evaluatePosition(state, ruleset, perspectivePlayer) {
    const evaluatorType = ruleset.evaluator?.type;
    const evaluator = EVALUATORS[evaluatorType];

    if (!evaluator) {
        throw new Error(
            `Unknown evaluator type: ${evaluatorType}`
        );
    }

    return evaluator(state, ruleset, perspectivePlayer);
}
