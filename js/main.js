const canvas = document.getElementById("gameCanvas");
const boardArea = document.getElementById("boardArea");

const game = new Game();

const statusElement  = document.getElementById("gameStatus");
const newGameButton = document.getElementById("newGameButton");
const undoButton = document.getElementById("undoButton");

new UI(canvas, boardArea, statusElement, game, newGameButton, undoButton);