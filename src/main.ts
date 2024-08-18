import { BufferGeometry, Mesh } from "three";
import { Game } from "./game";
import { acceleratedRaycast, computeBoundsTree } from "three-mesh-bvh";

// https://github.com/gkjohnson/three-mesh-bvh
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

export const game = new Game();
game.load().then(() => {
    game.start()
})