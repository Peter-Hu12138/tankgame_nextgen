import { Box3, Group, Vector3 } from "three";
import { generateUUID } from "three/src/math/MathUtils";
import { Ball } from "./ball";
import { Entity } from "./entity";
import { GRAVITY, MOVE_SPEED } from "./game";
import { game } from "./main";

export class Tank extends Entity {

    readonly id: string

    private model: Group
    private clientSide: boolean
    private onGround = false

    public lastUpdate = 0

    constructor(clientSide: boolean, id: string) {
        super()
        this.model = game.tankModel!.clone()
        this.clientSide = clientSide
        this.id = id
    }

    update() {
        if (!this.clientSide) return;

        // tank position
        const rotation = this.getRotation()
        if (game.getKeys().w)
            this.move(-MOVE_SPEED * Math.sin(rotation.y), -MOVE_SPEED * Math.cos(rotation.y))
        if (game.getKeys().a)
            this.move(0.5 * -MOVE_SPEED * Math.cos(rotation.y), 0.5 * MOVE_SPEED * Math.sin(rotation.y))
        if (game.getKeys().s)
            this.move(MOVE_SPEED * Math.sin(rotation.y), MOVE_SPEED * Math.cos(rotation.y))
        if (game.getKeys().d)
            this.move(0.5 * MOVE_SPEED * Math.cos(rotation.y), 0.5 * -MOVE_SPEED * Math.sin(rotation.y))
        // tank rotation
        rotation.y -= game.mouseX / 500

        // falling
        let bb_tank = this.getBB().clone().translate(new Vector3(0, GRAVITY, 0))
        if (!this.collisionCheck(bb_tank)) {
            this.getPosition().add(new Vector3(0, GRAVITY, 0))
            this.onGround = false
        } else {
            this.onGround = true
        }

    }

    updateCamera(): void {
        const position = this.getPosition()
        const rotation = this.getRotation()

        // camera position
        game.camera.position.set(position.x + 3 * Math.sin(rotation.y), position.y + 4, position.z + 3 * Math.cos(rotation.y))

        // camera rotation
        game.camera.rotation.y = rotation.y
        game.camera.rotation.x -= game.mouseY / 500
    }

    private move(x: number, z: number) {
        if (!this.clientSide) return;

        let fail = 0

        let bb_tank = this.getBB().clone().translate(new Vector3(x, 0, 0))
        if (!this.collisionCheck(bb_tank))
            this.getPosition().add(new Vector3(x, 0, 0))
        else
            fail++

        bb_tank = this.getBB().clone().translate(new Vector3(0, 0, z))
        if (!this.collisionCheck(bb_tank))
            this.getPosition().add(new Vector3(0, 0, z))
        else
            fail++

        // climb steps
        if (fail > 0 && this.onGround) {
            const CLIMB = 2.5
            let bb_tank = this.getBB().clone().translate(new Vector3(x, 0, z))
            let bb_tank2 = this.getBB().clone().translate(new Vector3(x, CLIMB, z))
            if (this.collisionCheck(bb_tank) && !this.collisionCheck(bb_tank2))
                this.getPosition().add(new Vector3(x, CLIMB, 0))

        }
    }

    shot() {
        const rotation = game.thePlayer!.getRotation()
        const velocity = new Vector3(
            -1 * Math.sin(rotation.y),
            1 * Math.sin(game.camera.rotation.x),
            -1 * Math.cos(rotation.y)
        )
        const pos = game.thePlayer!.getPosition().clone().add(velocity.clone().setLength(2))
        pos.y += 1.5

        const ball = new Ball(true, pos, velocity, generateUUID())
        game.scene.add(ball.getMesh())
        game.balls.push(ball)
    }

    getPosition() {
        return this.model.position
    }

    getRotation() {
        return this.model.rotation
    }

    getModel() {
        return this.model
    }

}