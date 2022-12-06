import { Box3, Group, Object3D, Raycaster, Vector3 } from "three";
import { generateUUID } from "three/src/math/MathUtils";
import { Ball } from "./ball";
import { Entity } from "./entity";
import { GRAVITY, MOVE_SPEED } from "./game";
import { game } from "./main";

const ROTATION_SPEED = 30

export class Tank extends Entity {

    private model: Group
    private modelBottom: Group
    private modelTop: Group
    private clientSide: boolean
    private onGround = false

    constructor(clientSide: boolean, id: string) {
        super(id)
        this.modelBottom = game.tankModelBottom!.clone()
        this.modelTop = game.tankModelTop!.clone()
        this.model = new Group()
        this.model.add(this.modelBottom, this.modelTop)
        this.clientSide = clientSide
    }

    update() {
        if (!this.clientSide) return;

        // tank position
        const rotation = this.getRotation()
        if (game.getKeys().a) {
            this.getRotation().y += ROTATION_SPEED / 500 * (game.getKeys().s ? -1 : 1)
            game.camera.rotation.y += ROTATION_SPEED / 500 * (game.getKeys().s ? -1 : 1)
        }
        if (game.getKeys().d) {
            this.getRotation().y -= ROTATION_SPEED / 500 * (game.getKeys().s ? -1 : 1)
            game.camera.rotation.y -= ROTATION_SPEED / 500 * (game.getKeys().s ? -1 : 1)
        }
        if (game.getKeys().w) {
            this.move(-MOVE_SPEED * Math.sin(rotation.y), -MOVE_SPEED * Math.cos(rotation.y))
        }
        if (game.getKeys().s) {
            this.move(MOVE_SPEED * Math.sin(rotation.y), MOVE_SPEED * Math.cos(rotation.y))
        }


        // falling
        let bb_tank = this.getBB().clone().translate(new Vector3(0, GRAVITY, 0))
        if (!this.collisionCheck(bb_tank)) {
            this.getPosition().add(new Vector3(0, GRAVITY, 0))
            this.onGround = false
        } else {
            this.onGround = true
        }

        // top
        this.modelTop.position.copy(this.getPosition())
        const r = game.camera.rotation.clone()
        r.x = 0
        this.modelTop.rotation.copy(r)

    }

    updateCamera(): void {
        const position = this.modelTop.position
        const rotation = this.modelTop.rotation

        // camera position
        game.camera.position.set(position.x + 3 * Math.sin(rotation.y), position.y + 4, position.z + 3 * Math.cos(rotation.y))

        // camera rotation
        game.camera.rotation.y -= game.mouseX / 500
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
        let velocity: Vector3
        let pos = new Vector3(0, 1.5, -5)
        pos.applyMatrix4(this.modelTop.matrixWorld)

        let rotation = game.camera.rotation.clone()

        let raycaster = new Raycaster(game.camera.position, new Vector3(0, 0, -1).applyEuler(rotation))
        let result = raycaster.intersectObjects(game.scene.children)
        if (result.length > 0) {
            velocity = result[0].point.clone().sub(pos).normalize()
        } else {
            velocity = new Vector3(0, 0, -0.01).applyEuler(rotation)
        }

        const ball = new Ball(true, pos, velocity, generateUUID())
        game.scene.add(ball.getMesh())
        game.balls.push(ball)
    }

    getPosition() {
        return this.modelBottom.position
    }

    getRotation() {
        return this.modelBottom.rotation
    }

    getModel() {
        return this.modelBottom
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

    removeEntity(): void {
        game.scene.remove(this.modelBottom)
        game.scene.remove(this.modelTop)
    }

    addEntity(): void {
        game.scene.add(this.modelBottom)
        game.scene.add(this.modelTop)
    }

    getModelTop() {
        return this.modelTop
    }

}