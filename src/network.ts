import { Vector3 } from "three"
import { generateUUID } from "three/src/math/MathUtils"
import { Ball } from "./ball"
import { game } from "./main"
import { PacketBall, PacketDie, PacketKill, PacketRemoveBall, PacketRemoveTank, PacketSetName, PakcetPos } from "./packets"
import { Tank } from "./tank"

const TIMEOUT = 30 * 5

export class Network {
    private existedTicks = 0

    private addr: string
    private ws!: WebSocket
    private id = generateUUID()

    private connected = false

    constructor(addr: string) {
        this.addr = addr
    }

    connect() {
        this.ws = new WebSocket(this.addr)
        this.ws.addEventListener("open", () => this.onOpen())
        this.ws.addEventListener("close", () => this.onClose())
        this.ws.addEventListener("message", (e) => this.onMessage(e.data as string))
    }

    onOpen() {
        console.log("WebSocket connected")
        this.connected = true
    }

    onClose() {
        this.connected = false
    }

    onMessage(msg: string) {
        let packet = JSON.parse(msg)
        if (packet.id === this.id) return
        switch (packet.action) {
            case "pos":
                this.handlePos(packet as PakcetPos)
                break
            case "ball":
                this.handleBall(packet as PacketBall)
                break
            case "rmtank":
                this.handleRemoveTank(packet as PacketRemoveTank)
                break
            case "kill":
                this.handleKill(packet as PacketKill)
                break
            case "rmball":
                this.handleRemoveBall(packet as PacketRemoveBall)
                break
            case "die":
                this.handleDie(packet as PacketDie)
                break
            case "name":
                this.handleSetName(packet as PacketSetName)
                break
        }
    }

    handleSetName(packet: PacketSetName) {
        game.ranking.updateUsername(packet.id, packet.name)
    }

    handleKill(packet: PacketKill) {
        game.ranking.addKill(packet.id)
        if (packet.target === this.id) {
            game.kill()
            game.ranking.addDeath("You")
        }
    }

    handleDie(packet: PacketDie) {
        game.ranking.addDeath(packet.id)
    }

    handleRemoveTank(packet: PacketRemoveTank) {
        game.remoteTanks = game.remoteTanks.filter((e) => {
            if (e.id === packet.id)
                game.scene.remove(e.getModel())
            return e.id !== packet.id
        })
    }

    handleRemoveBall(packet: PacketRemoveBall) {
        game.remoteBalls = game.remoteBalls.filter((e) => {
            if (e.id === packet.ballId)
                game.scene.remove(e.getMesh())
            return e.id !== packet.ballId
        })
    }

    handleBall(packet: PacketBall) {
        const ball = game.remoteBalls.find((ball) => ball.id === packet.ballId)
        if (ball === undefined) {
            const new_ball = new Ball(
                false,
                new Vector3(packet.x, packet.y, packet.z),
                new Vector3(packet.velocityX, packet.velocityY, packet.velocityZ),
                packet.ballId
            )
            new_ball.lastUpdate = this.existedTicks

            game.remoteBalls.push(new_ball)
            game.scene.add(new_ball.getMesh())
        } else {
            ball.getPosition().set(packet.x, packet.y, packet.z)
            ball.getVelocity().set(packet.velocityX, packet.velocityY, packet.velocityZ)
            ball.calcReflectPoint()
        }
    }

    handlePos(packet: PakcetPos) {
        const tank = game.remoteTanks.find((t) => t.id === packet.id)
        if (tank === undefined) { // new tank
            const new_tank = new Tank(game.tank!.clone(), false, packet.id)
            new_tank.getPosition().set(packet.x, packet.y, packet.z)
            new_tank.getRotation().set(packet.rotationX, packet.rotationY, packet.rotationZ)
            new_tank.lastUpdate = this.existedTicks

            game.remoteTanks.push(new_tank)
            game.scene.add(new_tank.getModel())
        } else { // existing tank
            tank.lastUpdate = this.existedTicks
            tank.getPosition().set(packet.x, packet.y, packet.z)
            tank.getRotation().set(packet.rotationX, packet.rotationY, packet.rotationZ)
        }
    }

    update() {
        this.existedTicks++
        if (this.existedTicks % 2 !== 0) return

        if (game.alive)
            this.send(new PakcetPos(
                game.theTank!.getPosition().x,
                game.theTank!.getPosition().y,
                game.theTank!.getPosition().z,
                game.theTank!.getRotation().x,
                game.theTank!.getRotation().y,
                game.theTank!.getRotation().z
            ))

        // remove timeout tanks
        game.remoteTanks = game.remoteTanks.filter((t) => {
            let valid = this.existedTicks - t.lastUpdate < TIMEOUT
            if (!valid) {
                game.scene.remove(t.getModel())
            }
            return valid
        })

        // set username
        if (this.existedTicks % 60 === 0) {
            this.send(new PacketSetName(game.name))
        }
    }

    updateClientBall(ball: Ball) {
        this.send(new PacketBall(
            ball.getPosition().x,
            ball.getPosition().y,
            ball.getPosition().z,
            ball.getVelocity().x,
            ball.getVelocity().y,
            ball.getVelocity().z,
            ball.id
        ))
    }

    send(packet: any) {
        packet.id = this.id
        this.ws.send(JSON.stringify(packet))
    }

    isConnected() {
        return this.connected
    }

}