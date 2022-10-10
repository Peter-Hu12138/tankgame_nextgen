import { Box3, BoxGeometry, Camera, Intersection, Mesh, MeshBasicMaterial, MeshStandardMaterial, Raycaster, ShortType, SphereGeometry, TriangleStripDrawMode, Vector3 } from "three";
import { generateUUID } from "three/src/math/MathUtils";
import { game } from "./main";
import { PacketKill, PacketRemoveBall } from "./packets";

const MOVE_SPEED = 1
const MAX_TICKS = 30 * 5

export class Ball {

    private velocity: Vector3
    private pos: Vector3
    private mesh: Mesh

    private existedTicks = 0
    public id: string
    private clientSide: boolean
    public lastUpdate = 0

    private nextIntersection: Intersection | undefined

    constructor(clientSide: boolean, pos: Vector3, velocity: Vector3, id: string) {
        this.clientSide = clientSide
        this.id = id

        this.velocity = velocity.setLength(MOVE_SPEED)
        this.pos = pos
        this.mesh = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), new MeshStandardMaterial({ color: 0xff0000 }))
        this.mesh.position.copy(pos)
        this.mesh.castShadow = true

        this.calcReflectPoint()

        if (this.clientSide) game.network.updateClientBall(this)
    }

    update() {
        if (this.nextIntersection !== undefined && this.pos.distanceTo(this.nextIntersection.point) < 1) {
            this.velocity.addScaledVector(this.nextIntersection.face!.normal, - this.nextIntersection.face!.normal.dot(this.velocity) * 2)
            this.calcReflectPoint()

            if (this.clientSide)
                game.network.updateClientBall(this)
        }

        this.pos.add(this.velocity)
        this.mesh.position.copy(this.pos)

        this.existedTicks++

        if (this.existedTicks > MAX_TICKS) {
            if (this.clientSide) {
                this.removeSelf()
            }
            else {
                game.removeRemoteBall(this)
                game.scene.remove(this.mesh)
            }
        }

        // kill
        if (this.clientSide) {
            const box3 = new Box3()
            box3.expandByObject(this.mesh)
            game.remoteTanks.forEach((remoteTank) => {
                if (remoteTank.getBB().intersectsBox(box3)) {
                    game.network.send(new PacketKill(remoteTank.id))
                    game.ranking.addKill("You")
                    this.removeSelf()
                }
            })
            if (this.existedTicks > 5 && game.thePlayer!.getBB().intersectsBox(box3)) {
                game.kill()
                this.removeSelf()
                game.ranking.addDeath("You")
            }
        }
    }

    removeSelf() {
        game.network.send(new PacketRemoveBall(this.id))
        game.removeClientBall(this)
        game.scene.remove(this.mesh)
    }

    calcReflectPoint() {
        const raycaster = new Raycaster()

        raycaster.set(this.pos, this.velocity.normalize())
        const intersections = raycaster.intersectObjects(game.mapObjects)
        if (intersections.length >= 1) {
            const closest = intersections[0]
            this.nextIntersection = closest
        } else {
            this.nextIntersection = undefined
        }
    }

    getMesh() {
        return this.mesh
    }

    getPosition() {
        return this.pos
    }

    getVelocity() {
        return this.velocity
    }
}

export function getShotPoint() {
    const rotation = game.thePlayer!.getRotation()
    const velocity = new Vector3(
        -1 * Math.sin(rotation.y),
        1 * Math.sin(game.camera.rotation.x),
        -1 * Math.cos(rotation.y)
    )
    const pos = game.thePlayer!.getPosition().clone().add(velocity.clone().setLength(2))
    pos.y += 1.5
    return {
        pos: pos,
        velocity: velocity.normalize()
    }
}

/**
 * 获取子弹着陆位置
 */
export function getLandPoint() {
    const start = getShotPoint()

    const raycaster = new Raycaster()
    raycaster.set(start.pos, start.velocity.normalize())

    const intersections = raycaster.intersectObjects(game.mapObjects)
    let point: Vector3
    if (intersections.length >= 1)
        point = intersections[0].point
    else
        point = start.pos.clone().add(start.velocity.clone().setLength(20))
    return point
}

export function shot() {
    const start = getShotPoint()
    const ball = new Ball(true, start.pos, start.velocity, generateUUID())
    game.scene.add(ball.getMesh())
    game.balls.push(ball)
}