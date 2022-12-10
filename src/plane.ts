import { Vector3, Euler, Object3D, Event, Group, Camera, Box3, Quaternion } from "three";
import { generateUUID } from "three/src/math/MathUtils";
import { Ball } from "./ball";
import { Entity } from "./entity";
import { game } from "./main";

const MOVE_SPEED = 0.8
const SHOT_DELAY = 300

export class Plane extends Entity {

    private model: Group
    private clientSide: boolean

    private lastShot = 0

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
        const velocity = new Vector3(0, 0, -1)
        velocity.applyEuler(rotation)

        this.getPosition().add(velocity.setLength(MOVE_SPEED))

        // wall check
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


        // rotation
        let euler = new Euler((game.getKeys().w ? 0.06 : 0) + (game.getKeys().s ? -0.04 : 0), 0, (game.getKeys().a ? 0.05 : 0) + (game.getKeys().d ? -0.05 : 0))

        this.rotateByEuler(euler)
    }

    updateCamera(): void {
        const position = this.getPosition()
        const rotation = this.getRotation()

        // camera position
        const offset = new Vector3(0, 8, 15)
        offset.applyMatrix4(this.model.matrix)
        game.camera.position.copy(offset)

        // camera rotation
        game.camera.setRotationFromQuaternion(this.model.quaternion)

    }

    getPosition() {
        return this.model.position
    }

    getRotation() {
        return this.model.rotation
    }

    rotateByEuler(euler: Euler) {
        let rot = new Quaternion
        rot.setFromEuler(euler)

        rot = this.model.quaternion.multiply(rot)

        this.model.setRotationFromQuaternion(rot)
    }

    getModel(): Object3D<Event> {
        return this.model
    }

    shot(): void {
        if (Date.now() - this.lastShot < SHOT_DELAY) return
        this.lastShot = Date.now()

        const velocity = new Vector3(0, 0, -1)
        velocity.applyQuaternion(this.model.quaternion)

        const pos = this.getPosition().clone().add(velocity.setLength(2))

        const ball = new Ball(true, pos, velocity.add(velocity.clone().setLength(MOVE_SPEED)), generateUUID())
        game.scene.add(ball.getMesh())
        game.balls.push(ball)
    }

    randomPos() {
        // random spawn point
        while (true) {
            const box3 = new Box3()
            game.mapBoundingBoxes!.forEach((each) => box3.union((each)))
            this.getPosition().set(
                (box3.max.x - box3.min.x) * Math.random() + box3.min.x,
                box3.max.y + 30 * Math.random(),
                (box3.max.z - box3.min.z) * Math.random() + box3.min.z
            )
            let bb_tank = this.getBB()
            if (!this.collisionCheck(bb_tank)) break
        }
    }


    removeEntity(): void {
        game.scene.remove(this.getModel())
    }
    addEntity(): void {
        game.scene.add(this.getModel())
    }

}