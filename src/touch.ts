import { game } from "./main";


export class Touch {

    private enabled = false
    private canvas: HTMLCanvasElement
    private joystickSize: number

    private previousX = 0
    private previousY = 0
    private startX = 0
    private startY = 0

    private width: number
    private height: number

    private joystickTouched = false
    private joystickID = -1
    private joystickX = 0
    private joystickY = 0

    private input = {
        "w": false,
        "a": false,
        "s": false,
        "d": false
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.joystickSize = canvas.width * 0.15
        this.width = canvas.width
        this.height = canvas.height
    }

    enable() {
        if (this.enabled) return
        this.enabled = true

        this.canvas.addEventListener("touchstart", (e) => {
            for (let i = 0; i < e.touches.length; i++) {
                let touch = e.touches[i]
                if (!this.isInsideJoystick(touch.clientX, touch.clientY)) {
                    this.previousX = touch.clientX
                    this.previousY = touch.clientY
                    this.startX = touch.clientX
                    this.startY = touch.clientY
                } else {
                    this.joystickID = touch.identifier
                    this.handleJoystickTouch(touch)
                }
            }
        })

        this.canvas.addEventListener("touchmove", (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]

                if (touch.identifier !== this.joystickID) {
                    // camera
                    let dx = touch.clientX - this.previousX
                    let dy = touch.clientY - this.previousY
                    this.previousX = touch.clientX
                    this.previousY = touch.clientY

                    game.mouseX += dx
                    game.mouseY += dy
                } else {
                    // joystick
                    this.handleJoystickTouch(touch)
                }

            }
        })

        this.canvas.addEventListener("touchend", (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                let touch = e.changedTouches[i]

                if (touch.identifier === this.joystickID) {
                    this.joystickID = -1
                    this.resetKeys()
                } else {
                    if (Math.abs(this.startX - touch.clientX) < 5 && Math.abs(this.startY - touch.clientY) < 5) {
                        game.thePlayer?.shot()
                    }
                }
            }
        })
    }

    onRender2D(ctx: CanvasRenderingContext2D) {
        if (!this.enabled) return

        ctx.fillStyle = "#00000080"
        ctx.fillRect(0, this.height - this.joystickSize, this.joystickSize, this.joystickSize)

        if (this.joystickID !== -1) {
            const size = this.joystickSize * 0.5
            ctx.fillStyle = "#000000FF"
            ctx.fillRect(this.joystickX - size / 2, this.joystickY - size / 2, size, size)
        }
    }

    isInsideJoystick(x: number, y: number) {
        return (x <= this.joystickSize) && (y >= this.height - this.joystickSize)
    }

    isEnabled() {
        return this.enabled
    }

    update() {
        if (!this.enabled) return

        game.getKeys().w = this.input.w
        game.getKeys().a = this.input.a
        game.getKeys().s = this.input.s
        game.getKeys().d = this.input.d
    }

    handleJoystickTouch(touch: globalThis.Touch) {
        let percentageX = touch.clientX / this.joystickSize
        let percentageY = (touch.clientY - (this.height - this.joystickSize)) / this.joystickSize

        this.resetKeys()

        let x = 0.5
        let y = 0.5
        if (percentageX > 0.75) {
            x = 1
            this.input.d = true
        }
        if (percentageX < 0.25) {
            x = 0
            this.input.a = true
        }
        if (percentageY > 0.75) {
            y = 1
            this.input.s = true
        }
        if (percentageY < 0.25) {
            y = 0
            this.input.w = true
        }

        this.joystickX = this.joystickSize * x
        this.joystickY = this.joystickSize * y + (this.height - this.joystickSize)
    }

    resetKeys() {
        this.input.w = false
        this.input.a = false
        this.input.s = false
        this.input.d = false
    }

}
