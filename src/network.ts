import { Vector3 } from "three"
import { generateUUID } from "three/src/math/MathUtils"
import { Ball } from "./ball"
import { Entity } from "./entity"
import { game } from "./main"
import { PacketBall, PacketChat, PacketDie, PacketKill, PacketRemoveBall, PacketRemoveTank, PacketSetName, PakcetTankPos, PakcetPlanePos } from "./packets"
import { Plane } from "./plane"
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
            case "tankpos":
                this.handleTankPos(packet as PakcetTankPos)
                break
            case "pos":
                this.handlePlanePos(packet as PakcetPlanePos)
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
            case "chat":
                this.handleChat(packet as PacketChat)
                break
        }
    }

    handleChat(packet: PacketChat) {
        if (packet.msg.length > 100) return
        game.chat.add(packet.id, packet.msg)
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
        game.remoteEntities = game.remoteEntities.filter((e) => {
            if (e.getId() === packet.id)
                e.removeEntity()
            return e.getId() !== packet.id
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

    handleTankPos(packet: PakcetTankPos) {
        const tank = (game.remoteEntities.find((t) => t.getId() === packet.id) as Tank)
        if (tank === undefined) { // new tank
            let new_entity = new Tank(false, packet.id)
            new_entity.getPosition().set(packet.x, packet.y, packet.z)
            new_entity.getRotation().set(packet.rotationX, packet.rotationY, packet.rotationZ)
            new_entity.lastUpdate = this.existedTicks

            game.remoteEntities.push(new_entity)
            new_entity.addEntity()

            this.updateUsername()
        } else { // existing tank
            tank.lastUpdate = this.existedTicks
            tank.getPosition().set(packet.x, packet.y, packet.z)
            tank.getRotation().set(packet.rotationX, packet.rotationY, packet.rotationZ)
            tank.getModelTop().position.set(packet.x, packet.y, packet.z)
            tank.getModelTop().rotation.set(packet.rotationTopX, packet.rotationTopY, packet.rotationTopZ)
        }
    }

    handlePlanePos(packet: PakcetPlanePos) {
        const tank = (game.remoteEntities.find((t) => t.getId() === packet.id) as Plane)
        if (tank === undefined) { // new plane
            let new_entity = new Plane(false, packet.id)
            new_entity.getPosition().set(packet.x, packet.y, packet.z)
            new_entity.getRotation().set(packet.rotationX, packet.rotationY, packet.rotationZ)
            new_entity.lastUpdate = this.existedTicks

            game.remoteEntities.push(new_entity)
            new_entity.addEntity()

            this.updateUsername()
        } else { // existing plane
            tank.lastUpdate = this.existedTicks
            tank.getPosition().set(packet.x, packet.y, packet.z)
            tank.getRotation().set(packet.rotationX, packet.rotationY, packet.rotationZ)
        }
    }

    update() {
        this.existedTicks++
        if (this.existedTicks % 2 !== 0) return

        if (game.alive)
            if (game.thePlayer! instanceof Tank) {
                const thePlayer = (game.thePlayer! as Tank)
                this.send(new PakcetTankPos(
                    thePlayer.getPosition().x,
                    thePlayer.getPosition().y,
                    thePlayer.getPosition().z,
                    thePlayer.getRotation().x,
                    thePlayer.getRotation().y,
                    thePlayer.getRotation().z,
                    thePlayer.getModelTop().rotation.x,
                    thePlayer.getModelTop().rotation.y,
                    thePlayer.getModelTop().rotation.z
                ))
            } else {
                const thePlayer = (game.thePlayer! as Plane)
                this.send(new PakcetPlanePos(
                    thePlayer.getPosition().x,
                    thePlayer.getPosition().y,
                    thePlayer.getPosition().z,
                    thePlayer.getRotation().x,
                    thePlayer.getRotation().y,
                    thePlayer.getRotation().z
                ))
            }

        // remove timeout tanks
        game.remoteEntities = game.remoteEntities.filter((t) => {
            let valid = this.existedTicks - t.lastUpdate < TIMEOUT
            if (!valid) {
                t.removeEntity()
            }
            return valid
        })

    }

    updateUsername() {
        this.send(new PacketSetName(game.name))
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
        if (!this.connected) return;
        packet.id = this.id
        this.ws.send(JSON.stringify(packet))
    }

    isConnected() {
        return this.connected
    }

    
    public getId() : string {
        return this.id
    }
    

}