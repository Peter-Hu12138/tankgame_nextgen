import { Box3, Euler, Object3D, Vector3 } from "three";
import { game } from "./main";

export abstract class Entity {

    abstract update(): void
    abstract updateCamera(): void
    abstract getPosition(): Vector3
    abstract getRotation(): Euler
    abstract getModel(): Object3D
    abstract shot(): void

    getBB() {
        let box = new Box3()
        box.expandByObject(this.getModel())
        return box
    }

    collisionCheck(bb_tank: Box3) {
        let collide = false
        for (let index = 0; index < game.mapBoundingBoxes!.length; index++) {
            const each = game.mapBoundingBoxes![index];
            if (each.intersectsBox(bb_tank)) {
                collide = true
                break
            }
        }
        return collide
    }

    randomPos() {
        // random spawn point
        while (true) {
            const box3 = new Box3()
            game.mapBoundingBoxes!.forEach((each) => box3.union((each)))
            this.getPosition().set(
                (box3.max.x - box3.min.x) * Math.random() + box3.min.x,
                (box3.max.y - box3.min.y) * Math.random() + box3.min.y,
                (box3.max.z - box3.min.z) * Math.random() + box3.min.z
            )
            let bb_tank = this.getBB()
            if (!this.collisionCheck(bb_tank)) break
        }
    }

}