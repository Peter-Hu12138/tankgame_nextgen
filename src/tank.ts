import { Box3, Group, Vector3 } from "three";
import { GRAVITY, MOVE_SPEED } from "./game";
import { game } from "./main";

export class Tank {

    readonly id: string

    private model: Group
    private clientSide: boolean
    private onGround = false

    public lastUpdate = 0

    constructor(model: Group, clientSide: boolean, id: string) {
        this.model = model
        this.clientSide = clientSide
        this.id = id
    }

    update() {
        if (!this.clientSide) return;

        // tank position
        const position = this.getPosition()
        const rotation = this.getRotation()
        if (game.getKeys().w)
            this.move(-MOVE_SPEED * Math.sin(rotation.y), -MOVE_SPEED * Math.cos(rotation.y))
        if (game.getKeys().s)
            this.move(MOVE_SPEED * Math.sin(rotation.y), MOVE_SPEED * Math.cos(rotation.y))
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

        // camera position
        game.camera.position.set(position.x + 3 * Math.sin(rotation.y), position.y + 4, position.z + 3 * Math.cos(rotation.y))

        // camera rotation
        game.camera.rotation.y = rotation.y
        game.camera.rotation.x -= game.mouseY / 500

    }

    private move(x: number, z: number) {
        if (!this.clientSide) return;

        let success = true // 是否成功移动

        let bb_tank = this.getBB().clone().translate(new Vector3(x, 0, 0))
        if (!this.collisionCheck(bb_tank))
            this.getPosition().add(new Vector3(x, 0, 0))
        else
            success = false

        bb_tank = this.getBB().clone().translate(new Vector3(0, 0, z))
        if (!this.collisionCheck(bb_tank))
            this.getPosition().add(new Vector3(0, 0, z))
        else
            success = false
        
        // climb steps
        if (!success && this.onGround) {
            const CLIMB = 2.5
            let bb_tank = this.getBB().clone().translate(new Vector3(x, CLIMB, z))
            if (!this.collisionCheck(bb_tank))
                this.getPosition().add(new Vector3(x, CLIMB, 0))

        }
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

    getBB(): Box3 {
        let box = new Box3()
        box.expandByObject(this.model)
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