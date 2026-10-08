const UI_CONFIG = {
    maxCellSize: 75
};

class UI {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.game = game;

        this.drag = null;

        canvas.addEventListener("pointerdown", e => this.down(e));
        canvas.addEventListener("pointermove", e => this.move(e));
        canvas.addEventListener("pointerup", e => this.up(e));
        canvas.addEventListener("pointercancel", e => this.up(e));

        addEventListener("resize", () => this.resize());

        this.resize();
    }

    resize() {
        const main = this.canvas.parentElement;
        const r = main.getBoundingClientRect();
        const d = devicePixelRatio || 1;

        const availableWidth = r.width;
        const availableHeight = window.innerHeight - r.top - 32;

        this.cellSize = Math.min(
            UI_CONFIG.maxCellSize,
            availableWidth / BOARD_SIZE,
            availableHeight / BOARD_SIZE
        );

        this.size = this.cellSize * BOARD_SIZE;

        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;

        this.canvas.width = Math.round(this.size * d);
        this.canvas.height = Math.round(this.size * d);

        this.ctx.setTransform(d, 0, 0, d, 0, 0);

        this.render();
    }

    cell(x, y) {
        return {
            x: (x + 0.5) * this.cellSize,
            y: (y + 0.5) * this.cellSize
        };
    }

    point(X, Y) {
        const r = this.canvas.getBoundingClientRect();

        const x = Math.floor((X - r.left) / this.cellSize);
        const y = Math.floor((Y - r.top) / this.cellSize);

        return isInsideBoard(x, y)
            ? { x, y }
            : null;
    }

    down(e) {
        if (this.game.gameOver) {
            return;
        }

        const p = this.point(e.clientX, e.clientY);
        const me = this.game.players[this.game.currentPlayer];

        if (!p || me.x !== p.x || me.y !== p.y) {
            return;
        }

        this.canvas.setPointerCapture(e.pointerId);

        this.drag = {
            player: this.game.currentPlayer,
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
        const s = this.size;
        const k = this.cellSize;

        c.clearRect(0, 0, s, s);

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const t = this.game.board[y][x];

                c.fillStyle = (x + y) % 2
                    ? "#c9c9c9"
                    : "#d7d7d7";

                c.fillRect(x * k, y * k, k, k);

                if (t.type === "parcours") {
                    this.goal(x, y);
                }

                if (t.type === "start") {
                    c.strokeStyle = "#777";
                    c.lineWidth = 2;

                    c.strokeRect(
                        x * k + 0.18 * k,
                        y * k + 0.18 * k,
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
            c.moveTo(i * k, 0);
            c.lineTo(i * k, s);
            c.stroke();

            c.beginPath();
            c.moveTo(0, i * k);
            c.lineTo(s, i * k);
            c.stroke();
        }

        for (const p of ["orange", "blue"]) {
            if (!(this.drag && this.drag.player === p)) {
                this.piece(this.game.players[p], p);
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