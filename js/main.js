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

new UI(
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
    legalMovesDisplaySelect
);