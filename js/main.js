const canvas = document.getElementById("gameCanvas");
const boardArea = document.getElementById("boardArea");

const game = new Game();

const statusElement  = document.getElementById("gameStatus");
const newGameButton = document.getElementById("newGameButton");

new UI(canvas, boardArea, statusElement, game, newGameButton);