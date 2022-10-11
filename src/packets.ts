class Packet {
    public id: string = ""
}

export class PakcetPos extends Packet {
    private action = "pos"
    readonly x: number
    readonly y: number
    readonly z: number
    readonly rotationX: number
    readonly rotationY: number
    readonly rotationZ: number
    readonly type: string

    constructor(x: number, y: number, z: number, rotationX: number, rotationY: number, rotationZ: number, type: string) {
        super()
        this.x = x
        this.y = y
        this.z = z
        this.rotationX = rotationX
        this.rotationY = rotationY
        this.rotationZ = rotationZ
        this.type = type
    }
    
}

export class PacketBall extends Packet {
    private action = "ball"
    readonly ballId: string
    readonly x: number
    readonly y: number
    readonly z: number
    readonly velocityX: number
    readonly velocityY: number
    readonly velocityZ: number

    constructor(x: number, y: number, z: number, velocityX: number, velocityY: number, velocityZ: number, ballId: string) {
        super()
        this.x = x
        this.y = y
        this.z = z
        this.velocityX = velocityX
        this.velocityY = velocityY
        this.velocityZ = velocityZ
        this.ballId = ballId
    }
    
}

export class PacketRemoveTank extends Packet {
    private action = "rmtank"
}

export class PacketRemoveBall extends Packet {
    private action = "rmball"
    readonly ballId: string

    constructor (ballId: string) {
        super()
        this.ballId = ballId
    }
}

export class PacketKill extends Packet {
    private action = "kill"
    readonly target: string

    constructor (target: string) {
        super()
        this.target = target
    }

}

export class PacketDie extends Packet {
    private action = "die"
}

export class PacketSetName extends Packet {
    private action = "name"
    readonly name: string

    constructor (name: string) {
        super()
        this.name = name
    }
}

export class PacketChat extends Packet {
    private action = "chat"
    readonly msg: string

    constructor (msg: string) {
        super()
        this.msg = msg
    }
}