const GOALS = {
    orange: [
        { x: 6, y: 6 },
        { x: 6, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 6 },
        { x: 3, y: 7 }
    ],

    blue: [
        { x: 1, y: 6 },
        { x: 1, y: 1 },
        { x: 6, y: 1 },
        { x: 6, y: 6 },
        { x: 4, y: 7 }
    ]
};


class Game {

    constructor() {
        this.blueStarts = false;

        this.newGame();
    }


    newGame() {
        this.board = createBoard();

        this.players = {
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

        this.currentPlayer = this.blueStarts
            ? "blue"
            : "orange";

        this.blueStarts = !this.blueStarts;

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

    getCurrentGoal(player) {
        return GOALS[player][this.players[player].reached];
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

            if (me.reached >= GOALS[player].length) {
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