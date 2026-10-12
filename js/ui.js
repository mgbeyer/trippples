const UI_CONFIG = {
    maxCellSize: 75,
    pieceOpacity: 0.65,
    pieceRadius: 0.3,      // fraction of cell size
    playerColors: {
        blue: "#4169a1",
        orange: "#d97925"
    }
};

class UI {
    constructor(
        canvas,
        boardArea,
        status,
        game,
        newGameButton,
        undoButton,
        blueMiniMap,
        orangeMiniMap,
        startingPlayerSelect,
        boardChoiceSelect,
        legalMovesDisplaySelect
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.boardArea = boardArea;
        this.status = status;
        this.game = game;
        this.newGameButton = newGameButton;
        this.undoButton = undoButton;
        this.miniMaps = {
            blue: blueMiniMap,
            orange: orangeMiniMap
        };
        this.startingPlayerSelect = startingPlayerSelect;
        this.boardChoiceSelect = boardChoiceSelect;
        this.legalMovesDisplaySelect = legalMovesDisplaySelect;
        this.drag = null;
        this.boardLeft = 0;
        this.boardTop = 0;

        canvas.addEventListener("pointerdown", e => this.down(e));
        canvas.addEventListener("pointermove", e => this.move(e));
        canvas.addEventListener("pointerup", e => this.up(e));
        canvas.addEventListener("pointercancel", () => {
            this.drag = null;
            this.render();
        });

        addEventListener("resize", () => this.resize());


        this.newGameButton.addEventListener("click", () => {
            this.drag = null;

            this.game.newGame({
                starterMode: this.startingPlayerSelect.value,
                boardMode: this.boardChoiceSelect.value
            });

            this.render();
        });

        this.undoButton.addEventListener("click", () => {
            this.drag = null;

            if (this.game.undo()) {
                this.render();
            }
        });

        this.legalMovesDisplaySelect.addEventListener("change", () => {
            this.render();
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


    updateCursor(e) {
        if (this.game.gameOver) {
            this.canvas.style.cursor = "default";
            return;
        }

        const p = this.point(e.clientX, e.clientY);

        if (!p) {
            this.canvas.style.cursor = "default";
            return;
        }

        const player = this.game.getCurrentPlayer();
        const pos = this.game.getPlayerPosition(player);

        if (pos.x !== p.x || pos.y !== p.y) {
            this.canvas.style.cursor = "default";
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const center = this.cell(pos.x, pos.y);

        const dx = e.clientX - rect.left - center.x;
        const dy = e.clientY - rect.top - center.y;
        const radius = UI_CONFIG.pieceRadius * this.cellSize;

        this.canvas.style.cursor =
            dx * dx + dy * dy <= radius * radius
                ? "grab"
                : "default";
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

        this.canvas.style.cursor = "grabbing";

        this.render();
    }

    move(e) {
        if (!this.drag) {
            this.updateCursor(e);
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

        this.updateCursor(e);

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

        const displayMode = this.legalMovesDisplaySelect.value;

        const showLegalMoves =
            !this.game.gameOver &&
            (
                displayMode === "always" ||
                (displayMode === "dragging" && this.drag !== null)
            );

        const legalMoveKeys = new Set(
            showLegalMoves
                ? this.game.getLegalMoves().map(move => `${move.x},${move.y}`)
                : []
        );

        c.clearRect(
            0,
            0,
            this.width,
            this.height
        );

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const t = board[y][x];


                const currentPlayer = this.game.getCurrentPlayer();
                const playerPosition = this.game.getPlayerPosition(currentPlayer);

                const isCurrentPosition =
                    playerPosition.x === x &&
                    playerPosition.y === y;

                c.fillStyle = (x + y) % 2
                    ? "#c9c9c9"
                    : "#d7d7d7";

                c.fillRect(
                    this.boardLeft + x * k,
                    this.boardTop + y * k,
                    k,
                    k
                );

                if (isCurrentPosition) {
                    c.fillStyle = currentPlayer === "blue"
                        ? "rgba(65, 105, 161, 0.22)"
                        : "rgba(217, 121, 37, 0.22)";

                    c.fillRect(
                        this.boardLeft + x * k,
                        this.boardTop + y * k,
                        k,
                        k
                    );
                }
                
                if (legalMoveKeys.has(`${x},${y}`)) {
                    c.fillStyle = "rgba(76, 175, 80, 0.28)";

                    c.fillRect(
                        this.boardLeft + x * k,
                        this.boardTop + y * k,
                        k,
                        k
                    );
                }

                if (t.type === "parcours") {
                    const player = this.game.getCurrentPlayer();
                    const owners = this.game.getGoalOwners(x, y);

                    this.goal(
                        x,
                        y,
                        owners.includes(player) ? [player] : []
                    );
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
                this.drag.player,
                true
            );
        }

        this.updateStatus();
        this.renderMiniMaps();

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

        c.strokeStyle = UI_CONFIG.playerColors[player];

        c.lineWidth = 3;

        c.strokeRect(
            x + 2,
            y + 2,
            k - 4,
            k - 4
        );

        c.restore();
    }
    
    renderMiniMaps() {
        const currentPlayer = this.game.gameOver
            ? null
            : this.game.getCurrentPlayer();

        for (const player of ["blue", "orange"]) {
            const card = this.miniMaps[player].closest(".playerInfo");

            card.classList.toggle(
                "active-blue",
                currentPlayer === "blue" && player === "blue"
            );

            card.classList.toggle(
                "active-orange",
                currentPlayer === "orange" && player === "orange"
            );
        }

        this.renderMiniMap("blue");
        this.renderMiniMap("orange");
    }

    renderMiniMap(player) {
        const svg = this.miniMaps[player];

        if (!svg) {
            return;
        }

        const color = UI_CONFIG.playerColors[player];
        const state = this.game.getPlayerState(player);
        const goals = this.game.getGoals(player);
        const start = this.game.getPlayerStart(player);
        const finalGoal = goals[goals.length - 1];

        const nextGoal = this.game.gameOver
            ? null
            : goals[state.reached];

        const from = state.reached === 0
            ? start
            : goals[state.reached - 1];

        const point = p => ({
            x: 25 + p.x * 15,
            y: 25 + p.y * 15
        });

        let activeLine = "";

        if (nextGoal && from) {
            const a = point(from);
            const b = point(nextGoal);

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const length = Math.hypot(dx, dy);

            if (length > 0) {
                const offsetStart = 9;
                const offsetEnd = 11;

                activeLine = `
                    <line
                        x1="${a.x + dx / length * offsetStart}"
                        y1="${a.y + dy / length * offsetStart}"
                        x2="${b.x - dx / length * offsetEnd}"
                        y2="${b.y - dy / length * offsetEnd}"
                        stroke="${color}"
                        stroke-width="3.5"
                        stroke-linecap="round"
                        marker-end="url(#arrow-${player})"
                    />
                `;
            }
        }

        const stations = goals.slice(0, -1).map((goal, index) => {
            const p = point(goal);
            const reached = index < state.reached;

            const active = nextGoal &&
                nextGoal.x === goal.x &&
                nextGoal.y === goal.y;

            return `
                <circle
                    cx="${p.x}"
                    cy="${p.y}"
                    r="${active ? 10 : 8}"
                    fill="#dedede"
                    stroke="${active ? color : "#555"}"
                    stroke-width="${active ? 2.5 : 1.5}"
                />

                ${reached ? `
                    <path
                        d="M ${p.x - 3} ${p.y + 4}
                        V ${p.y - 5}
                        L ${p.x + 4} ${p.y - 3}
                        L ${p.x - 3} ${p.y}
                        Z"
                        fill="${color}"
                        stroke="${color}"
                        stroke-width="1.2"
                        stroke-linejoin="round"
                    />
                ` : ""}
            `;
        }).join("");

        const startPoint = point(start);
        const finalPoint = point(finalGoal);

        const finalReached = state.reached >= goals.length;

        const finalIsActive = nextGoal &&
            nextGoal.x === finalGoal.x &&
            nextGoal.y === finalGoal.y;

        svg.innerHTML = `
            <title>Parcours von ${player === "blue"
                ? "Spieler A"
                : "Spieler B"}</title>

            <defs>
                <marker
                    id="arrow-${player}"
                    markerWidth="7"
                    markerHeight="7"
                    refX="5"
                    refY="3.5"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <path
                        d="M 0 0 L 7 3.5 L 0 7 Z"
                        fill="${color}"
                    />
                </marker>
            </defs>

            ${activeLine}

            ${stations}

            <!-- Eigener Start -->
            <circle
                cx="${startPoint.x}"
                cy="${startPoint.y}"
                r="7"
                fill="${color}"
                stroke="#222"
                stroke-width="1"
            />
            <text
                x="${startPoint.x}"
                y="${startPoint.y + 3}"
                font-size="8"
                text-anchor="middle"
                fill="#fff"
                font-weight="bold"
            >S</text>

            <!-- Finales Ziel: Startfeld des Gegners -->
            ${finalIsActive ? `
                <rect
                    x="${finalPoint.x - 11}"
                    y="${finalPoint.y - 11}"
                    width="22"
                    height="22"
                    rx="2"
                    fill="none"
                    stroke="${color}"
                    stroke-width="2"
                />
            ` : ""}

            <rect
                x="${finalPoint.x - 7}"
                y="${finalPoint.y - 7}"
                width="14"
                height="14"
                rx="2"
                fill="${finalReached ? color : "#303134"}"
                stroke="${color}"
                stroke-width="1.5"
            />
            <text
                x="${finalPoint.x}"
                y="${finalPoint.y + 3}"
                font-size="8"
                text-anchor="middle"
                fill="#fff"
                font-weight="bold"
            >Z</text>
        `;
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
    
    goal(x, y, owners = []) {
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

        if (owners.length > 0) {
            const flagLeft = c.x - 0.07 * this.cellSize;
            const flagTop = c.y - 0.13 * this.cellSize;
            const flagRight = c.x + 0.15 * this.cellSize;
            const flagMiddle = c.y - 0.06 * this.cellSize;
            const flagBottom = c.y + 0.01 * this.cellSize;

            // Flaggenmast
            q.beginPath();
            q.moveTo(flagLeft, c.y + 0.14 * this.cellSize);
            q.lineTo(flagLeft, flagTop);
            q.stroke();

            if (owners.length === 1) {
                // Eine Farbe, wenn nur ein Spieler das Feld erreicht hat
                q.fillStyle = UI_CONFIG.playerColors[owners[0]];
                q.beginPath();
                q.moveTo(flagLeft, flagTop);
                q.lineTo(flagRight, flagMiddle);
                q.lineTo(flagLeft, flagBottom);
                q.closePath();
                q.fill();
            } else {
                // Zweifarbige Flagge, wenn beide Spieler das Feld erreicht haben
                q.fillStyle = UI_CONFIG.playerColors.blue;
                q.beginPath();
                q.moveTo(flagLeft, flagTop);
                q.lineTo(flagRight, flagMiddle);
                q.lineTo(flagLeft, flagMiddle);
                q.closePath();
                q.fill();

                q.fillStyle = UI_CONFIG.playerColors.orange;
                q.beginPath();
                q.moveTo(flagLeft, flagMiddle);
                q.lineTo(flagRight, flagMiddle);
                q.lineTo(flagLeft, flagBottom);
                q.closePath();
                q.fill();
            }
        } else {    // zeichne X
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


    drawPieceAt(x, y, n, isDragging = false) {
        const q = this.ctx;

        q.save();

        q.globalAlpha = isDragging
            ? 1
            : UI_CONFIG.pieceOpacity;

        q.fillStyle = UI_CONFIG.playerColors[n];

        q.strokeStyle = "#222";
        q.lineWidth = Math.max(
            1,
            (isDragging ? 0.045 : 0.025) * this.cellSize
        );

        q.beginPath();
        q.arc(
            x,
            y,
            UI_CONFIG.pieceRadius * this.cellSize,
            0,
            Math.PI * 2
        );

        q.fill();
        q.stroke();

        q.restore();
    }

}