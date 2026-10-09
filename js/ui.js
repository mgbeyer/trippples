const UI_CONFIG = {
    maxCellSize: 75
};

class UI {
    constructor(canvas, boardArea, status, game, newGameButton, undoButton) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.boardArea = boardArea;
        this.status = status;
        this.game = game;
        this.newGameButton = newGameButton;
        this.undoButton = undoButton;

        this.drag = null;
        this.boardLeft = 0;
        this.boardTop = 0;

        canvas.addEventListener("pointerdown", e => this.down(e));
        canvas.addEventListener("pointermove", e => this.move(e));
        canvas.addEventListener("pointerup", e => this.up(e));
        canvas.addEventListener("pointercancel", e => this.up(e));

        addEventListener("resize", () => this.resize());

        this.newGameButton.addEventListener("click", () => {
            this.drag = null;
            this.game.newGame();
            this.render();
        });

        this.undoButton.addEventListener("click", () => {
            this.drag = null;

            if (this.game.undo()) {
                this.render();
            }
        });

        this.resize();
    }

    resize() {
        const r = this.boardArea.getBoundingClientRect();
        const d = devicePixelRatio || 1;

        const availableWidth = r.width;
        const availableHeight = r.height;
        this.width = availableWidth;
        this.height = availableHeight;

        this.cellSize = Math.min(
            UI_CONFIG.maxCellSize,
            availableWidth / BOARD_SIZE,
            availableHeight / BOARD_SIZE
        );

        this.size = this.cellSize * BOARD_SIZE;

        this.boardLeft = (availableWidth - this.size) / 2;
        this.boardTop = (availableHeight - this.size) / 2;

        this.canvas.width = Math.round(availableWidth * d);
        this.canvas.height = Math.round(availableHeight * d);

        this.canvas.style.width = `${availableWidth}px`;
        this.canvas.style.height = `${availableHeight}px`;

        this.ctx.setTransform(d, 0, 0, d, 0, 0);

        this.render();
    }

    cell(x, y) {
        return {
            x: this.boardLeft + (x + 0.5) * this.cellSize,
            y: this.boardTop + (y + 0.5) * this.cellSize
        };
    }

    point(X, Y) {
        const r = this.canvas.getBoundingClientRect();

        const x = Math.floor(
            (X - r.left - this.boardLeft) / this.cellSize
        );

        const y = Math.floor(
            (Y - r.top - this.boardTop) / this.cellSize
        );

        return isInsideBoard(x, y)
            ? { x, y }
            : null;
    }

    down(e) {
        if (this.game.gameOver) {
            return;
        }

        const p = this.point(e.clientX, e.clientY);
        const currentPlayer = this.game.getCurrentPlayer();
        const me = this.game.getPlayerPosition(currentPlayer);

        if (!p || me.x !== p.x || me.y !== p.y) {
            return;
        }

        this.canvas.setPointerCapture(e.pointerId);

        this.drag = {
            player: currentPlayer,
            from: { ...p },
            X: e.clientX,
            Y: e.clientY
        };

        this.render();
    }

    move(e) {
        if (!this.drag) {
            return;
        }

        this.drag.X = e.clientX;
        this.drag.Y = e.clientY;

        this.render();
    }

    up(e) {
        if (!this.drag) {
            return;
        }

        const d = this.drag;
        this.drag = null;

        const p = this.point(e.clientX, e.clientY);

        if (p) {
            this.game.move(d.from, p);
        }

        this.render();
    }

    render() {
        const c = this.ctx;
        const k = this.cellSize;
        const board = this.game.getBoard();

        c.clearRect(
            0,
            0,
            this.width,
            this.height
        );

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const t = board[y][x];

                c.fillStyle = (x + y) % 2
                    ? "#c9c9c9"
                    : "#d7d7d7";

                c.fillRect(
                    this.boardLeft + x * k,
                    this.boardTop + y * k,
                    k,
                    k
                );

                if (t.type === "parcours") {
                    this.goal(x, y);
                }

                if (t.type === "start") {
                    c.strokeStyle = "#777";
                    c.lineWidth = 2;

                    c.strokeRect(
                        this.boardLeft + x * k + 0.18 * k,
                        this.boardTop + y * k + 0.18 * k,
                        0.64 * k,
                        0.64 * k
                    );
                }

                if (t.type === "arrows") {
                    this.arrows(x, y, t.mask);
                }
            }
        }

        c.strokeStyle = "#888";
        c.lineWidth = 1;

        for (let i = 0; i <= 8; i++) {
            c.beginPath();
            c.moveTo(
                this.boardLeft + i * k,
                this.boardTop
            );
            c.lineTo(
                this.boardLeft + i * k,
                this.boardTop + this.size
            );
            c.stroke();

            c.beginPath();
            c.moveTo(
                this.boardLeft,
                this.boardTop + i * k
            );
            c.lineTo(
                this.boardLeft + this.size,
                this.boardTop + i * k
            );
            c.stroke();
        }

        this.drawCurrentGoal();

        for (const p of ["orange", "blue"]) {
            if (!(this.drag && this.drag.player === p)) {
                this.piece(
                    this.game.getPlayerPosition(p),
                    p
                );
            }
        }
        
        if (this.drag) {
            const r = this.canvas.getBoundingClientRect();

            this.drawPieceAt(
                this.drag.X - r.left,
                this.drag.Y - r.top,
                this.drag.player
            );
        }

        this.updateStatus();

        this.undoButton.disabled = this.game.history.length === 0;
    }

    drawCurrentGoal() {
        if (this.game.gameOver) {
            return;
        }

        const player = this.game.getCurrentPlayer();
        const goal = this.game.getCurrentGoal(player);

        if (!goal) {
            return;
        }

        const k = this.cellSize;
        const x = this.boardLeft + goal.x * k;
        const y = this.boardTop + goal.y * k;
        const c = this.ctx;

        c.save();

        c.strokeStyle = player === "blue"
            ? "#4169a1"
            : "#d97925";

        c.lineWidth = 3;

        c.strokeRect(
            x + 2,
            y + 2,
            k - 4,
            k - 4
        );

        c.restore();
    }
    
    updateStatus() {
        const state = this.game.getState();

        const playerNames = {
            blue: "Spieler A – Blau",
            orange: "Spieler B – Orange"
        };

        if (state.gameOver) {
            this.status.textContent =
                `${playerNames[state.winner]} gewinnt!`;
        } else {
            this.status.textContent =
                `${playerNames[state.currentPlayer]} ist am Zug.`;
        }

        this.status.dataset.state = state.gameOver
            ? "finished"
            : "playing";
    }
    
    goal(x, y) {
        const c = this.cell(x, y);
        const q = this.ctx;

        q.strokeStyle = "#555";
        q.lineWidth = 2;

        q.strokeRect(
            c.x - 0.2 * this.cellSize,
            c.y - 0.2 * this.cellSize,
            0.4 * this.cellSize,
            0.4 * this.cellSize
        );

        q.beginPath();

        q.moveTo(
            c.x - 0.14 * this.cellSize,
            c.y - 0.14 * this.cellSize
        );

        q.lineTo(
            c.x + 0.14 * this.cellSize,
            c.y + 0.14 * this.cellSize
        );

        q.moveTo(
            c.x + 0.14 * this.cellSize,
            c.y - 0.14 * this.cellSize
        );

        q.lineTo(
            c.x - 0.14 * this.cellSize,
            c.y + 0.14 * this.cellSize
        );

        q.stroke();
    }

    arrows(x, y, m) {
        const c = this.cell(x, y);
        const q = this.ctx;
        const r = 0.27 * this.cellSize;

        q.strokeStyle = "#555";
        q.fillStyle = "#555";
        q.lineWidth = Math.max(1, 0.025 * this.cellSize);

        q.fillStyle = "#000";

        q.beginPath();
        q.arc(
            c.x,
            c.y,
            0.035 * this.cellSize,
            0,
            Math.PI * 2
        );
        q.fill();

        for (let i = 0; i < 8; i++) {
            if (!(m & (1 << i))) {
                continue;
            }

            const d = DIRECTIONS[i];

            const ex = c.x + d.x * r;
            const ey = c.y + d.y * r;

            const sx = c.x + d.x * r * 0.18;
            const sy = c.y + d.y * r * 0.18;

            q.beginPath();
            q.moveTo(sx, sy);
            q.lineTo(ex, ey);
            q.stroke();

            const a = Math.atan2(d.y, d.x);
            const h = 0.07 * this.cellSize;

            q.beginPath();

            q.moveTo(ex, ey);

            q.lineTo(
                ex - Math.cos(a - Math.PI / 6) * h,
                ey - Math.sin(a - Math.PI / 6) * h
            );

            q.lineTo(
                ex - Math.cos(a + Math.PI / 6) * h,
                ey - Math.sin(a + Math.PI / 6) * h
            );

            q.closePath();
            q.fill();
        }
    }

    piece(p, n) {
        const c = this.cell(p.x, p.y);

        this.drawPieceAt(c.x, c.y, n);
    }

    drawPieceAt(x, y, n) {
        const q = this.ctx;

        q.fillStyle = n === "orange"
            ? "#d97925"
            : "#4169a1";

        q.strokeStyle = "#222";
        q.lineWidth = Math.max(1, 0.025 * this.cellSize);

        q.beginPath();
        q.arc(
            x,
            y,
            0.25 * this.cellSize,
            0,
            Math.PI * 2
        );

        q.fill();
        q.stroke();
    }
}