import { Box3, Euler, Object3D, Vector3 } from "three";
import { game } from "./main";

export abstract class Entity {

    private id: string

    public lastUpdate = 0

    constructor (id: string) {
        this.id = id
    }

    abstract update(): void
    abstract updateCamera(): void
    abstract getPosition(): Vector3
    abstract getRotation(): Euler
    abstract getModel(): Object3D
    abstract shot(): void
    abstract getShotPoint(): { pos: Vector3, velocity: Vector3 }
    abstract randomPos(): void

    getId() {
        return this.id
    }

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


}