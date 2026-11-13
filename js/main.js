const canvas = document.getElementById("gameCanvas");
const boardArea = document.getElementById("boardArea");

const game = new Game();

const statusElement  = document.getElementById("gameStatus");
const newGameButton = document.getElementById("newGameButton");
const undoButton = document.getElementById("undoButton");
const blueMiniMap = document.getElementById("blueMiniMap");
const orangeMiniMap = document.getElementById("orangeMiniMap");
const startingPlayerSelect =
    document.getElementById("startingPlayer");

const boardChoiceSelect =
    document.getElementById("boardChoice");

const legalMovesDisplaySelect =
    document.getElementById("legalMovesDisplay");

const rulesetChoiceSelect =
    document.getElementById("rulesetChoice");

const rulesetConfirmDialog =
    document.getElementById("rulesetConfirmDialog");

const computerPlayerSelect =
    document.getElementById("computerPlayer");

const searchDepthSelect =
    document.getElementById("searchDepth");


function handleGameChanged() {
    const computerPlayer = computerPlayerSelect.value;

    if (
        computerPlayer === "none" ||
        game.gameOver ||
        game.getCurrentPlayer() !== computerPlayer
    ) {
        return;
    }

    const depth = Number.parseInt(
        searchDepthSelect.value,
        10
    );

    const result = findBestMove(game, { depth });

    if (!result) {
        return;
    }

    const from = game.getPlayerPosition(computerPlayer);

    game.move(from, result.move);

    ui.render();
}


const ui = new UI(
    canvas,
    boardArea,
    statusElement,
    game,
    newGameButton,
    undoButton,
    blueMiniMap,
    orangeMiniMap,
    startingPlayerSelect,
    boardChoiceSelect,
    legalMovesDisplaySelect,
    computerPlayerSelect,
    searchDepthSelect,
    handleGameChanged
);

computerPlayerSelect.addEventListener("change", () => {
    ui.render();
    handleGameChanged();
});

// If the computer is the starting player, let it make the first move.
handleGameChanged();

let activeRulesetId = game.ruleset.id;

rulesetChoiceSelect.addEventListener("change", () => {
    if (rulesetChoiceSelect.value === activeRulesetId) {
        return;
    }

    rulesetConfirmDialog.showModal();
});

rulesetConfirmDialog.addEventListener("close", () => {
    if (rulesetConfirmDialog.returnValue !== "confirm") {
        rulesetChoiceSelect.value = activeRulesetId;
        return;
    }

    const rulesetId = rulesetChoiceSelect.value;
    const ruleset = RULESETS[rulesetId];

    if (!ruleset) {
        rulesetChoiceSelect.value = activeRulesetId;
        return;
    }

    game.setRuleset(ruleset, {
        starterMode: startingPlayerSelect.value
    });

    activeRulesetId = rulesetId;

    ui.drag = null;
    ui.render();

    handleGameChanged();
});