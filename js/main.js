const canvas = document.getElementById("gameCanvas");
const boardArea = document.getElementById("boardArea");

const game = new Game();

new UI(canvas, boardArea, game);