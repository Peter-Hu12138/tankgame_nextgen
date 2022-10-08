import { Game } from "./game";

export const game = new Game();
game.load().then(() => {
    game.start()
})