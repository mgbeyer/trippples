
function createUIHarness() {
    const canvas = document.createElement("canvas");

    const boardArea = {
        getBoundingClientRect() {
            return {
                left: 0,
                top: 0,
                width: 640,
                height: 640
            };
        }
    };

    canvas.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 640,
        height: 640,
        right: 640,
        bottom: 640
    });

    canvas.setPointerCapture = () => {};

    function createControl(value = "") {
        return {
            value,
            disabled: false,
            addEventListener() {}
        };
    }

    function createMiniMap() {
        const card = document.createElement("div");
        card.classList.add("playerInfo");

        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        card.appendChild(svg);

        return svg;
    }

    const game = new Game();

    const blueMiniMap = createMiniMap();
    const orangeMiniMap = createMiniMap();

    const ui = new UI(
        canvas,
        boardArea,
        document.createElement("div"),
        game,
        createControl(),
        createControl(),
        blueMiniMap,
        orangeMiniMap,
        createControl("random"),
        createControl("random"),
        createControl("off")
    );

    const legalMoveRects = [];
    const originalFillRect = ui.ctx.fillRect;

    ui.ctx.fillRect = function (x, y, width, height) {
        if (this.fillStyle === "rgba(76, 175, 80, 0.28)") {
            legalMoveRects.push({ x, y, width, height });
        }

        return originalFillRect.call(
            this,
            x,
            y,
            width,
            height
        );
    };

    function getActualLegalMoves() {
        return legalMoveRects.map(rect => ({
            x: Math.round(
                (rect.x - ui.boardLeft) / ui.cellSize
            ),
            y: Math.round(
                (rect.y - ui.boardTop) / ui.cellSize
            )
        }));
    }

    function getExpectedLegalMoves() {
        return game.getLegalMoves().map(move => ({
            x: move.x,
            y: move.y
        }));
    }

    function renderMode(mode) {
        legalMoveRects.length = 0;
        ui.legalMovesDisplaySelect.value = mode;
        ui.render();

        return getActualLegalMoves();
    }

    function startDragging() {
        const player = game.getCurrentPlayer();
        const position = game.getPlayerPosition(player);
        const point = ui.cell(position.x, position.y);

        ui.down({
            clientX: point.x,
            clientY: point.y,
            pointerId: 1
        });
    }

    function stopDragging() {
        const player = game.getCurrentPlayer();
        const position = game.getPlayerPosition(player);
        const point = ui.cell(position.x, position.y);

        legalMoveRects.length = 0;

        ui.up({
            clientX: point.x,
            clientY: point.y,
            pointerId: 1
        });
    }

    return {
        game,
        ui,
        legalMoveRects,
        getActualLegalMoves,
        getExpectedLegalMoves,
        renderMode,
        startDragging,
        stopDragging
    };
}


// Aus: keine Markierungen, auch nicht während des Ziehens
function testLegalMovesOff() {
    const h = createUIHarness();

    h.startDragging();

    const expected = [];
    const actual = h.renderMode("off");

    return { expected, actual };
}


// Immer: alle legalen Zielfelder sind markiert
function testLegalMovesAlways() {
    const h = createUIHarness();

    const expected = h.getExpectedLegalMoves();
    const actual = h.renderMode("always");

    return { expected, actual };
}


// Beim Ziehen: ohne aktiven Zug keine Markierungen
function testLegalMovesDraggingInactive() {
    const h = createUIHarness();

    const expected = [];
    const actual = h.renderMode("dragging");

    return { expected, actual };
}


// Beim Ziehen: während des Ziehens alle legalen Ziele markieren
function testLegalMovesDraggingActive() {
    const h = createUIHarness();

    h.renderMode("dragging");
    h.startDragging();

    const expected = h.getExpectedLegalMoves();
    const actual = h.getActualLegalMoves();

    return { expected, actual };
}


// Nach dem Ziehen müssen die Markierungen verschwinden
function testLegalMovesDraggingFinished() {
    const h = createUIHarness();

    h.renderMode("dragging");
    h.startDragging();
    h.stopDragging();

    const expected = [];
    const actual = h.getActualLegalMoves();

    return { expected, actual };
}


// Nach Spielende werden keine legalen Züge markiert
function testLegalMovesAfterGameOver() {
    const h = createUIHarness();

    h.game.gameOver = true;

    const expected = [];
    const actual = h.renderMode("always");

    return { expected, actual };
}


TESTS.push(
    {
        suite: "UI",
        name: "Legal moves off",
        description: "No legal-move highlights in off mode.",
        test: testLegalMovesOff
    },
    {
        suite: "UI",
        name: "Legal moves always",
        description: "All legal destinations are highlighted.",
        test: testLegalMovesAlways
    },
    {
        suite: "UI",
        name: "Dragging mode inactive",
        description: "No highlights when no piece is being dragged.",
        test: testLegalMovesDraggingInactive
    },
    {
        suite: "UI",
        name: "Dragging mode active",
        description: "All legal destinations are highlighted while dragging.",
        test: testLegalMovesDraggingActive
    },
    {
        suite: "UI",
        name: "Dragging mode finished",
        description: "Highlights disappear after dragging ends.",
        test: testLegalMovesDraggingFinished
    },
    {
        suite: "UI",
        name: "Legal moves after game over",
        description: "No legal destinations are highlighted after game over.",
        test: testLegalMovesAfterGameOver
    }
);
