import { Vector3, Euler, Object3D, Event, Group, Camera, Box3 } from "three";
import { generateUUID } from "three/src/math/MathUtils";
import { Ball } from "./ball";
import { Entity } from "./entity";
import { game } from "./main";

const MOVE_SPEED = 0.8

export class Plane extends Entity {

    private model: Group
    private clientSide: boolean

    constructor(clientSide: boolean, id: string) {
        super(id)
        this.clientSide = clientSide
        this.model = game.planeModel!.clone()
        this.model.rotation.reorder("YZX")
    }

    update(): void {
        if (!this.clientSide) return

        // move foward
        const rotation = this.getRotation()
        const velocity = new Vector3(
            -1 * Math.sin(rotation.y),
            0.5 * Math.sin(rotation.x),
            -1 * Math.cos(rotation.y)
        )
        this.getPosition().add(velocity.setLength(MOVE_SPEED))

        if (game.alive && this.collisionCheck(this.getBB())) {
            let collied = false
            this.model.children.forEach((child) => {
                let box = new Box3()
                box.expandByObject(child)
                if (this.collisionCheck(box)) collied = true
            })
            if (collied) {
                game.kill()
                game.ranking.addDeath("You")
            }
        }

        // tank rotation
        rotation.y -= game.mouseX / 500
        rotation.x -= game.mouseY / 500
    }

    updateCamera(): void {
        const position = this.getPosition()
        const rotation = this.getRotation()

        // camera position
        const offset = new Vector3(0, 8, 15)
        offset.applyMatrix4(this.model.matrixWorld)
        game.camera.position.copy(offset)

        // camera rotation
        game.camera.rotation.y = rotation.y
        game.camera.rotation.x = rotation.x

    }

    getPosition() {
        return this.model.position
    }

    getRotation() {
        return this.model.rotation
    }

    getModel(): Object3D<Event> {
        return this.model
    }

    shot(): void {
        
    }

    randomPos() {
        // random spawn point
        while (true) {
            const box3 = new Box3()
            game.mapBoundingBoxes!.forEach((each) => box3.union((each)))
            this.getPosition().set(
                (box3.max.x - box3.min.x) * Math.random() + box3.min.x,
                box3.max.y + 20 + 30 * Math.random(),
                (box3.max.z - box3.min.z) * Math.random() + box3.min.z
            )
            let bb_tank = this.getBB()
            if (!this.collisionCheck(bb_tank)) break
        }
    }

}