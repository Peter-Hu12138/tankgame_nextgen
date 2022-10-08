import { Box3, BoxGeometry, Intersection, Mesh, MeshBasicMaterial, MeshStandardMaterial, Raycaster, SphereGeometry, TriangleStripDrawMode, Vector3 } from "three";
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
                    this.removeSelf()
                }
            })
            if (this.existedTicks > 5 && game.theTank!.getBB().intersectsBox(box3)) {
                game.kill()
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