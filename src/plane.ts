import { Vector3, Euler, Object3D, Event, Group, Box3, Quaternion } from "three";
import { generateUUID, degToRad } from "three/src/math/MathUtils";
import { Ball } from "./ball";
import { Entity } from "./entity";
import { game } from "./main";
import { TPS } from "./game";

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
        this.model.rotation.reorder("YXZ")
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

        const rotate_w = [
            [90, 45] /* pitch */,
            [45, 45] /*yaw*/,
            [200, 200] /*roll*/
        ].map((a) => [degToRad(a[0] / TPS), degToRad(a[1]) / TPS])

        let keys = {
            w: game.getKeys().w,
            s: game.getKeys().s,
            aleft: game.getKeys().aleft,
            aright: game.getKeys().aright,
            a: game.getKeys().a,
            d: game.getKeys().d
        }

        if (game.plane_swap_w_s) {
            const w = keys.w
            keys.w = keys.s
            keys.s = w
        }

        // rotation
        let euler = new Euler(
            (keys.w ? rotate_w[0][0] : 0) +
            (keys.s ? -rotate_w[0][1] : 0),
            (keys.aleft ? rotate_w[1][0] : 0) +
            (keys.aright ? -rotate_w[1][1] : 0),
            (keys.a ? rotate_w[2][0] : 0) +
            (keys.d ? -rotate_w[2][1] : 0)
        )

        this.rotateByEuler(euler)
    }

    updateCamera(): void {
        let rotation = this.model.rotation.clone()
        rotation.z = 0

        // camera rotation
        game.camera.setRotationFromEuler(rotation)

        // camera position
        let offset = new Vector3(0, 5, 15)
        offset = offset.applyEuler(rotation).add(this.model.position)
        game.camera.position.copy(offset)
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