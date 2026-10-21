
class Game {
    constructor(ruleset = RULESETS.current) {
        this.ruleset = ruleset;
        this.nextAlternatingStarter = "orange";

        this.newGame();
    }

    setRuleset(
        ruleset,
        { starterMode = "alternate" } = {}
    ) {
        this.ruleset = ruleset;

        this.newGame({
            starterMode,
            boardMode: "random"
        });
    }

    newGame({
        starterMode = "alternate",
        boardMode = "random"
    } = {}) {
        if (boardMode !== "reuse" || !this.board) {
            this.board = createBoard(this.ruleset);
        }

        this.players = {
            orange: {
                ...this.ruleset.players.orange.start,
                reached: 0
            },

            blue: {
                ...this.ruleset.players.blue.start,
                reached: 0
            }
        };

        if (starterMode === "blue" || starterMode === "orange") {
            this.currentPlayer = starterMode;
        } else {
            this.currentPlayer = this.nextAlternatingStarter;

            this.nextAlternatingStarter =
                this.nextAlternatingStarter === "orange"
                    ? "blue"
                    : "orange";
        }

        this.gameOver = false;
        this.winner = null;
        this.history = [];
    }

    getState() {
        return {
            board: this.board,
            players: this.players,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner
        };
    }

    getBoard() {
        return this.board;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    getPlayerPosition(player) {
        const p = this.players[player];

        return {
            x: p.x,
            y: p.y
        };
    }

    getPlayerState(player) {
        return {
            ...this.players[player]
        };
    }

    getGoals(player) {
        return this.ruleset.players[player].route.map(
            position => ({ ...position })
        );
    }

    getPlayerStart(player) {
        return {
            ...this.ruleset.players[player].start
        };
    }

    hasReachedGoal(x, y) {
        return Object.keys(this.players).some(player => {
            const reached = this.players[player].reached;

            return this.getGoals(player)
                .slice(0, reached)
                .some(goal => goal.x === x && goal.y === y);
        });
    }

    getGoalOwners(x, y) {
        return Object.keys(this.players).filter(player => {
            const reached = this.players[player].reached;

            return this.getGoals(player)
                .slice(0, reached)
                .some(goal => goal.x === x && goal.y === y);
        });
    }

    getCurrentGoal(player) {
        const route = this.ruleset.players[player].route;
        const goal = route[this.players[player].reached];

        return goal ? { ...goal } : null;
    }

    getLegalMoves(player = this.currentPlayer) {
        return getLegalMoves(
            this.getState(),
            player
        );
    }

    move(from, to) {
        if (this.gameOver) {
            return {
                ok: false,
                reason: "game-over"
            };
        }

        const player = this.currentPlayer;
        const me = this.players[player];

        if (
            me.x !== from.x ||
            me.y !== from.y
        ) {
            return {
                ok: false,
                reason: "wrong-piece"
            };
        }

        const legalMoves = this.getLegalMoves(player);

        if (!legalMoves.some(
            move =>
                move.x === to.x &&
                move.y === to.y
        )) {
            return {
                ok: false,
                reason: "illegal-move"
            };
        }

        this.history.push({
            players: structuredClone(this.players),
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner
        });

        me.x = to.x;
        me.y = to.y;

        const goal = this.getCurrentGoal(player);

        if (
            goal &&
            me.x === goal.x &&
            me.y === goal.y
        ) {
            me.reached++;

            if (me.reached >= this.ruleset.players[player].route.length) {
                this.gameOver = true;
                this.winner = player;

                return {
                    ok: true,
                    goal: true,
                    won: true
                };
            }
        }

        this.currentPlayer = getOpponentName(player);

        if (this.getLegalMoves(this.currentPlayer).length === 0) {
            this.gameOver = true;
            this.winner = player;
        }

        return {
            ok: true
        };
    }

    canUndo() {
        return this.history.length > 0;
    }

    undo() {
        if (!this.history.length) {
            return false;
        }

        const history = this.history.pop();

        this.players = history.players;
        this.currentPlayer = history.currentPlayer;
        this.gameOver = history.gameOver;
        this.winner = history.winner;

        return true;
    }
}
