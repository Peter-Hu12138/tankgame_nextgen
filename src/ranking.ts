class Record {
    id: string
    value: number
    constructor(id: string) {
        this.id = id
        this.value = 1
    }
}

export class Ranking {
    private usernames: any = {
        "You": "You"
    }
    private kills: Array<Record> = []
    private death: Array<Record> = []

    private existedTicks = 0

    private y = 0

    addKill(name: string) {
        let record = this.kills.find((r) => r.id === name)
        if (record === undefined)
            this.kills.push(new Record(name))
        else
            record.value += 1
    }

    addDeath(name: string) {
        let record = this.death.find((r) => r.id === name)
        if (record === undefined)
            this.death.push(new Record(name))
        else
            record.value += 1
    }

    update() {
        this.existedTicks++
        if (this.existedTicks % 10 === 0) {
            this.kills.sort((a, b) => a.value - b.value)
            this.death.sort((a, b) => a.value - b.value)
        }
    }

    onRender2D(ctx: CanvasRenderingContext2D) {
        this.y = 0
        this.writeLine(ctx, "Kills")
        for (let index = 0; index < this.kills.length; index++) {
            const v = this.kills[index]
            this.writeLine(ctx, `${index + 1}. ${this.usernames[v.id]} - ${v.value}`)
        }
        this.writeLine(ctx, "")
        this.writeLine(ctx, "Deaths")
        for (let index = 0; index < this.death.length; index++) {
            const v = this.death[index]
            this.writeLine(ctx, `${index + 1}. ${this.usernames[v.id]} - ${v.value}`)
        }
    }

    writeLine(ctx: CanvasRenderingContext2D, text: string) {
        ctx.font = '24px serif'
        this.y += ctx.measureText(text).fontBoundingBoxAscent
        ctx.fillStyle = "#ffffffff"
        ctx.fillText(text, 0, this.y)
    }

    updateUsername(id: string, name: string) {
        this.usernames[id] = name
    }
}