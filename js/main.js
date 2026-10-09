const canvas = document.getElementById("gameCanvas");
const boardArea = document.getElementById("boardArea");

const game = new Game();

const status = document.getElementById("gameStatus");

new UI(canvas, boardArea, status, game);