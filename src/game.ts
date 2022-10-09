import { Box3, BufferGeometry, DirectionalLight, Group, HemisphereLight, Line, LineBasicMaterial, Matrix4, Mesh, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, Raycaster, Renderer, Scene, Vector3, WebGLRenderer } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { generateUUID } from "three/src/math/MathUtils";
import { Ball, getLandPoint, getShotPoint, shot } from "./ball";
import { initBoundingBoxes, initMap } from "./map";
import { Network } from "./network";
import { PacketDie, PacketKill, PacketRemoveTank, PacketSetName } from "./packets";
import { Ranking } from "./ranking";
import { Tank } from "./tank";

export const TPS = 30
export const MOVE_SPEED = 0.5
export const GRAVITY = -0.5
const ADDRESS = `wss://${location.host}/tankgamews`
const BALL_DELAY = 500
const RESPAWN = 3000

const load_obj = (name: string) => {
    return new Promise<Group>((resolve, reject) => {
        const loader = new OBJLoader();
        loader.load(
            name,
            (obj) => {
                resolve(obj)
            },
            (xhr) => {
                console.log("Loading...", xhr.loaded / xhr.total)
            },
            (err) => {
                reject(err)
            }
        )
    })
}

export class Game {

    public scene: Scene
    public camera: PerspectiveCamera
    public tank: Group | undefined
    private renderer: Renderer | undefined

    public alive = true
    public theTank: Tank | undefined
    public remoteTanks: Array<Tank> = []

    private keys = { "w": false, "s": false, "space": false, "c": false, "left": false, "a": false, "d": false, "r": false }
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

    constructor() {
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight)
        this.camera.rotation.order = 'YXZ'

        const light = new DirectionalLight(0xffffff)
        light.position.set(50, 30, 0)
        this.scene.add(light)

        const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        this.network = new Network(ADDRESS)

        this.canvas = document.getElementById("2d") as HTMLCanvasElement
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }

    async load() {
        // tank model
        const obj = await load_obj("tank.obj")
        obj.children.forEach((child) => {
            (child as Mesh).material = new MeshStandardMaterial({ color: 0x00a000 })
        })
        obj.scale.set(0.5, 0.5, 0.5)
        this.tank = obj.clone()

        this.renderer = new WebGLRenderer()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)

        // map model
        let obj_map = await load_obj("map.obj")
        obj_map.applyMatrix4(new Matrix4().scale(new Vector3(2, 2, 2)))
        this.map = initMap(obj_map)
        this.map.forEach((each) => {
            const mesh = new Mesh(each, new MeshPhongMaterial())
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
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ranking.onRender2D(this.context)
        if (!this.alive) {
            this.context.fillStyle = "#00000080"
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
            this.context.font = '32px serif'
            this.context.fillStyle = "#ffffffff"
            this.context.fillText("你死了", this.canvas.width / 2 - this.context.measureText("你死了").width / 2, this.canvas.height / 2)
        }
        if (!this.network.isConnected()) {
            this.context.fillStyle = "#00000080"
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
            this.context.font = '32px serif'
            this.context.fillStyle = "#ffffffff"
            this.context.fillText("服务器连接丢失", this.canvas.width / 2 - this.context.measureText("服务器连接丢失s").width / 2, this.canvas.height / 2)
        }
    }

    kill() {
        if (!this.alive) return
        this.network.send(new PacketDie())
        this.network.send(new PacketRemoveTank())
        this.alive = false
        this.theTank!.randomPos()
        setTimeout(() => {
            this.alive = true
        }, RESPAWN);
    }

    start() {
        this.theTank = new Tank(this.tank!.clone().translateY(5), true, "")
        this.scene.add(this.theTank.getModel())

        document.body.addEventListener("keydown", (e) => {
            if ((this.keys as any)[e.key] !== undefined)
                (this.keys as any)[e.key] = true
            if (e.key === " ")
                this.keys.space = true
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
            if (name !== null) this.name = name
        })

        setInterval(() => this.onTick(), 1000 / TPS)
        requestAnimationFrame(() => this.onRender())

        this.network.connect()
        this.theTank!.randomPos()
    }

    onTick() {
        this.theTank!.update()

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
