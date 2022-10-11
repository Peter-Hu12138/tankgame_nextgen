import { Game } from "./game";

if (navigator.userAgent.includes("Firefox"))
    alert("WARNING: Firefox is not supported.")

export const game = new Game();
game.load().then(() => {
    game.start()
})