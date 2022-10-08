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
        let collide = false
        game.map!.forEach((each) => {
            each.computeBoundingBox()
            if (each.boundingBox!.intersectsBox(bb_tank))
                collide = true
        })
        if (!collide) {
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
        let collide = false
        game.mapBoundingBoxes!.forEach((each) => {
            if (each.intersectsBox(bb_tank)) collide = true
        })
        if (!collide)
            this.getPosition().add(new Vector3(x, 0, 0))
        else
            success = false

        bb_tank = this.getBB().clone().translate(new Vector3(0, 0, z))
        collide = false
        game.mapBoundingBoxes!.forEach((each) => {
            if (each.intersectsBox(bb_tank)) collide = true
        })
        if (!collide)
            this.getPosition().add(new Vector3(0, 0, z))
        else
            success = false
        
        // climb steps
        if (!success && this.onGround) {
            const CLIMB = 2.5
            let bb_tank = this.getBB().clone().translate(new Vector3(x, CLIMB, z))
            let collide = false
            game.mapBoundingBoxes!.forEach((each) => {
                if (each.intersectsBox(bb_tank)) collide = true
            })
            if (!collide)
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
}