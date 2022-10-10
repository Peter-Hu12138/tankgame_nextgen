import { AmbientLight, Box3, BufferGeometry, CameraHelper, DirectionalLight, DirectionalLightShadow, Group, HemisphereLight, Line, LineBasicMaterial, Matrix4, Mesh, MeshPhongMaterial, MeshStandardMaterial, Object3D, PCFSoftShadowMap, PerspectiveCamera, Raycaster, Renderer, Scene, Vector3, WebGLRenderer } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { generateUUID } from "three/src/math/MathUtils";
import { Ball, getLandPoint, getShotPoint, shot } from "./ball";
import { Chat } from "./chat";
import { Entity } from "./entity";
import { initBoundingBoxes, initMap } from "./map";
import { loadMap, loadTank } from "./models";
import { Network } from "./network";
import { PacketDie, PacketKill, PacketRemoveTank, PacketSetName } from "./packets";
import { Ranking } from "./ranking";
import { Tank } from "./tank";

export const TPS = 30
export const MOVE_SPEED = 0.5
export const GRAVITY = -0.5
const ADDRESS = location.hostname === "127.0.0.1" ? "ws://127.0.0.1:8080" : `wss://${location.host}/tankgamews`
const BALL_DELAY = 500
const RESPAWN = 3000



export class Game {

    public scene: Scene
    public camera: PerspectiveCamera
    public tank: Group | undefined
    private renderer: WebGLRenderer | undefined

    public alive = true
    public thePlayer: Entity | undefined
    public remoteTanks: Array<Tank> = []

    private keys = { "w": false, "s": false, "space": false, "c": false, "left": false, "a": false, "d": false, "t": false }
    public mouseX = 0
    public mouseY = 0

    public map: Array<BufferGeometry> | undefined
    public mapBoundingBoxes: Array<Box3> | undefined
    public mapObjects: Array<Object3D> = []

    public balls: Array<Ball> = []
    public remoteBalls: Array<Ball> = []
    private lastBall = 0

    public network: Network

    private context: CanvasRenderingContext2D
    private canvas: HTMLCanvasElement

    private zooming = false
    private zoomHelper: Line | undefined

    public ranking = new Ranking()
    public name = "undefined"

    public chat = new Chat()

    constructor() {
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight)
        this.camera.rotation.order = 'YXZ'

        // lights
        const directionalLight = new DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(-20, 25, -10)
        directionalLight.castShadow = true
        directionalLight.shadow.camera.near = 0.01
        directionalLight.shadow.camera.far = 500
        directionalLight.shadow.camera.right = 60
        directionalLight.shadow.camera.left = -60
        directionalLight.shadow.camera.top = 60
        directionalLight.shadow.camera.bottom = -60
        directionalLight.shadow.mapSize.width = 1024
        directionalLight.shadow.mapSize.height = 1024
        directionalLight.shadow.radius = 4
        directionalLight.shadow.bias = -0.00006
        this.scene.add(directionalLight)

        const hemisphereLight = new HemisphereLight(0x4488bb, 0x002244, 0.3)
        this.scene.add(hemisphereLight)

        const ambientLight = new AmbientLight(0xa0a0a0, 0.2)
        this.scene.add(ambientLight)

        // network
        this.network = new Network(ADDRESS)

        // 2d canvas
        this.canvas = document.getElementById("2d") as HTMLCanvasElement
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }

    async load() {
        // tank model
        this.tank = await loadTank()

        // renderer
        this.renderer = new WebGLRenderer()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer!.shadowMap.enabled = true
        document.body.appendChild(this.renderer.domElement)

        // map model
        const obj_map = await loadMap()
        this.map = initMap(obj_map)
        this.map.forEach((each) => {
            const mesh = new Mesh(each, new MeshPhongMaterial())
            mesh.castShadow = true
            mesh.receiveShadow = true
            this.scene.add(mesh)
            this.mapObjects.push(mesh)
        })
        this.mapBoundingBoxes = initBoundingBoxes(this.map)
    }

    onRender() {
        this.renderer?.render(this.scene, this.camera)
        this.onRender2D()
        requestAnimationFrame(() => this.onRender())
    }

    onRender2D() {
        const drawText = (text: string) => {
            this.context.fillStyle = "#00000080"
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
            this.context.font = '32px serif'
            this.context.fillStyle = "#ffffffff"
            this.context.fillText(text, this.canvas.width / 2 - this.context.measureText(text).width / 2, this.canvas.height / 2)
        }
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ranking.onRender2D(this.context)
        if (!this.alive) {
            drawText("你死了")
        }
        this.chat.onRender2D(this.context, this.canvas.width, this.canvas.height)
        if (!this.network.isConnected()) {
            drawText("服务器连接丢失")
        }
    }

    kill() {
        if (!this.alive) return
        this.network.send(new PacketDie())
        this.network.send(new PacketRemoveTank())
        this.alive = false
        setTimeout(() => {
            this.alive = true
            this.thePlayer!.randomPos()
        }, RESPAWN);
    }

    start() {
        this.thePlayer = new Tank(true, "")
        this.scene.add(this.thePlayer.getModel())

        document.body.addEventListener("keydown", (e) => {
            if ((this.keys as any)[e.key] !== undefined)
                (this.keys as any)[e.key] = true
            if (e.key === " ")
                this.keys.space = true
            this.chat.onKeyPress(e)
        })
        document.body.addEventListener("keyup", (e) => {
            if ((this.keys as any)[e.key] !== undefined)
                (this.keys as any)[e.key] = false
            if (e.key === " ")
                this.keys.space = false
        })
        document.body.addEventListener("mousemove", (e) => {
            this.mouseX += e.movementX
            this.mouseY += e.movementY
        })
        document.body.addEventListener("mousedown", () => {
            if (document.pointerLockElement === document.body) this.keys.left = true
        })
        document.body.addEventListener("mouseup", () => {
            if (document.pointerLockElement === document.body) this.keys.left = false
        })
        this.canvas.onclick = () => {
            document.body.requestPointerLock()
        }
        document.getElementById("btn")?.addEventListener("click", () => {
            let name = prompt("Username:")
            if (name !== null) this.name = (name.length < 20 ? name : "我妈死了 我要炸房")
            this.network.updateUsername()
        })

        setInterval(() => this.onTick(), 1000 / TPS)
        requestAnimationFrame(() => this.onRender())

        this.network.connect()
        this.thePlayer!.randomPos()

    }

    onTick() {
        if (this.chat.input) return
        if (this.keys.t) this.chat.input = true

        this.thePlayer!.update()
        this.thePlayer!.updateCamera()

        // zoom
        if (this.keys.c && !this.zooming) {
            this.zooming = true
            this.camera.zoom = 1.3
            this.camera.updateProjectionMatrix()

            const start = getShotPoint()
            this.zoomHelper = new Line(new BufferGeometry().setFromPoints([
                start.pos, getLandPoint()
            ]), new LineBasicMaterial({ color: 0xff0000 }))
            this.scene.add(this.zoomHelper)
        }
        if (!this.keys.c && this.zooming) {
            this.zooming = false
            this.camera.zoom = 1
            this.camera.updateProjectionMatrix()
            this.scene.remove(this.zoomHelper!)
        }
        if (this.zooming) {
            const start = getShotPoint()
            this.zoomHelper!.geometry.setFromPoints([
                start.pos, getLandPoint()
            ])
        }

        // shot
        if (this.alive && this.keys.left && Date.now() - this.lastBall > BALL_DELAY) {
            this.lastBall = Date.now()
            shot()
        }

        this.balls.forEach((ball) => {
            ball.update()
        })

        this.remoteBalls.forEach((ball) => {
            ball.update()
        })

        this.network.update()

        this.mouseX = 0
        this.mouseY = 0
    }

    removeClientBall(ball: Ball) {
        this.balls = this.balls.filter((v) => v.id !== ball.id)
    }

    removeRemoteBall(ball: Ball) {
        this.remoteBalls = this.remoteBalls.filter((v) => v.id !== ball.id)
    }

    getKeys() {
        return this.keys
    }

}
