import { game } from "./main"
import { PacketChat } from "./packets"

const MAX = 10
const MAX_TIME = 6 * 1000

class Record {
    readonly id: string
    readonly msg: string
    readonly time: number
    constructor(id: string, msg: string) {
        this.id = id
        this.msg = msg
        this.time = Date.now()
    }
}

export class Chat {
    private chats: Array<Record> = []
    public input = false
    public msg = ""
    private y = 0

    add(id: string, msg: string) {
        this.chats.push(new Record(id, msg))
    }

    onRender2D(ctx: CanvasRenderingContext2D, w: number, h: number) {
        this.chats = this.chats.filter((v, i) => i > this.chats.length - MAX && Date.now() - v.time < MAX_TIME)

        if (this.input) {
            ctx.fillStyle = "#00000080"
            ctx.fillRect(0, 0, w, h)

            ctx.font = '24px serif'
            let y = h - ctx.measureText(this.msg).fontBoundingBoxAscent
            ctx.fillStyle = "#ffffffff"
            ctx.fillText(this.msg, 0, y)
        }

        this.y = 50
        this.chats.forEach((e) => {
            this.writeLine(ctx, `${game.ranking.getUsername(e.id)}: ${e.msg}`, w)
        })

    }

    writeLine(ctx: CanvasRenderingContext2D, text: string, w: number) {
        ctx.font = '24px serif'
        ctx.fillStyle = "#ffffffff"

        if (ctx.measureText(text).width > w * 0.2) {
            let new_text = ""
            let width = 0
            text.split("").forEach((c) => {
                width += ctx.measureText(c).width
                if (width > w * 0.2) {
                    new_text += "\n"
                    new_text += c
                    width = 0
                } else {
                    new_text += c
                }
            })
            text = new_text
        }

        text.split("\n").forEach((l) => {
            this.y += ctx.measureText(text).fontBoundingBoxAscent
            ctx.fillText(l, w * 0.8, this.y)
        })
    }

    onKeyPress(e: KeyboardEvent) {
        if (!this.input) return
        
        if (e.code.toLocaleLowerCase() === "enter") {
            this.input = false
            game.network.send(new PacketChat(this.msg))
            this.add("You", this.msg)
            this.msg = ""
        }
        else if (e.code.toLocaleLowerCase() === "backspace") {
            this.msg = this.msg.slice(0, this.msg.length - 1)
        }
        else if (e.key.length === 1) {
            this.msg += e.key
        }
    }

}