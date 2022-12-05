class Packet {
    public id: string = ""
}

export class PakcetPlanePos extends Packet {
    private action = "pos"
    readonly x: number
    readonly y: number
    readonly z: number
    readonly rotationX: number
    readonly rotationY: number
    readonly rotationZ: number

    constructor(x: number, y: number, z: number, rotationX: number, rotationY: number, rotationZ: number) {
        super()
        this.x = x
        this.y = y
        this.z = z
        this.rotationX = rotationX
        this.rotationY = rotationY
        this.rotationZ = rotationZ
    }

}

export class PakcetTankPos extends Packet {
    private action = "tankpos"
    readonly x: number
    readonly y: number
    readonly z: number
    readonly rotationX: number
    readonly rotationY: number
    readonly rotationZ: number
    readonly rotationTopX: number
    readonly rotationTopY: number
    readonly rotationTopZ: number

    constructor(x: number, y: number, z: number, rotationX: number, rotationY: number, rotationZ: number, topX: number, topY: number, topZ: number) {
        super()
        this.x = x
        this.y = y
        this.z = z
        this.rotationX = rotationX
        this.rotationY = rotationY
        this.rotationZ = rotationZ
        this.rotationTopX = topX
        this.rotationTopY = topY
        this.rotationTopZ = topZ
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

    constructor(ballId: string) {
        super()
        this.ballId = ballId
    }
}

export class PacketKill extends Packet {
    private action = "kill"
    readonly target: string

    constructor(target: string) {
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

    constructor(name: string) {
        super()
        this.name = name
    }
}

export class PacketChat extends Packet {
    private action = "chat"
    readonly msg: string

    constructor(msg: string) {
        super()
        this.msg = msg
    }
}