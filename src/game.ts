import { AmbientLight, Box3, BufferGeometry, CameraHelper, Clock, Color, DirectionalLight, Fog, Group, HemisphereLight, MathUtils, Mesh, MeshPhongMaterial, MeshStandardMaterial, Object3D, PCFSoftShadowMap, PerspectiveCamera, RepeatWrapping, Scene, ShaderMaterial, TextureLoader, Vector3, WebGLRenderer } from "three";
import { Ball } from "./ball";
import { Chat } from "./chat";
import { Entity } from "./entity";
import { initBoundingBoxes, initMap } from "./map";
import { loadMap, loadPlane, loadTankBottom, loadTankTop } from "./models";
import { Network } from "./network";
import { PacketDie, PacketRemoveTank } from "./packets";
import { Plane } from "./plane";
import { Ranking } from "./ranking";
import { Tank } from "./tank";
import { Sky } from "three/examples/jsm/objects/Sky"
import { Touch } from "./touch";

export const TPS = 30
export const MOVE_SPEED = 0.5
export const GRAVITY = -0.5
const ADDRESS = location.hostname === "localhost" ? `ws://${location.hostname}:8080` : `wss://${location.host}/tankgamews`
//const ADDRESS = `ws://${location.hostname}:8080`
const BALL_DELAY = 500
const RESPAWN = 3000



export class Game {

    public scene: Scene
    public camera: PerspectiveCamera
    public tankModelBottom: Group | undefined
    public tankModelTop: Group | undefined
    public planeModel: Group | undefined
    private renderer: WebGLRenderer | undefined

    public alive = true
    public thePlayer: Entity | undefined
    public remoteEntities: Array<Entity> = []

    private keys = { "w": false, "s": false, "space": false, "c": false, "left": false, "a": false, "d": false, "t": false, "aup": false, "aleft": false, "aright": false, "adown": false }
    public plane_swap_w_s = false
    public mouseX = 0
    public mouseY = 0

    public map: Array<BufferGeometry> | undefined
    public mapBoundingBoxes: Array<Box3> | undefined
    public mapObjects: Array<Object3D> = []

    public balls: Array<Ball> = []
    public remoteBalls: Array<Ball> = []

    public network: Network

    private context: CanvasRenderingContext2D
    private canvas: HTMLCanvasElement

    public ranking = new Ranking()
    public name = "undefined"

    public chat = new Chat()

    private touch!: Touch

    constructor() {
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight)
        this.camera.rotation.order = 'YXZ'

        // lights
        const directionalLight = new DirectionalLight(0xffffff, 0.6)
        directionalLight.position.set(-20, 50, -0)
        directionalLight.castShadow = true
        directionalLight.shadow.camera.near = 0.01
        directionalLight.shadow.camera.far = 500
        directionalLight.shadow.camera.right = 600
        directionalLight.shadow.camera.left = -600
        directionalLight.shadow.camera.top = 600
        directionalLight.shadow.camera.bottom = -600
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048
        directionalLight.intensity = 0.8
        this.scene.add(directionalLight)

        const hemisphereLight = new HemisphereLight(0x4488bb, 0x002244, 0.3)
        this.scene.add(hemisphereLight)

        const ambientLight = new AmbientLight(0xffffff, 0.2)
        this.scene.add(ambientLight)

        const helper = new CameraHelper(directionalLight.shadow.camera);
        this.scene.add(helper);

        // network
        this.network = new Network(ADDRESS)

        // 2d canvas
        this.canvas = document.getElementById("2d") as HTMLCanvasElement
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        // sky
        const sky = new Sky()
        sky.scale.setScalar(450000)
        const uniforms = sky.material.uniforms
        uniforms['turbidity'].value = 5
        uniforms['rayleigh'].value = 3
        uniforms['mieCoefficient'].value = 0.005
        uniforms['mieDirectionalG'].value = 0.7
        const sun = new Vector3()
        const phi = MathUtils.degToRad(90 - 2)
        const theta = MathUtils.degToRad(270)
        sun.setFromSphericalCoords(1, phi, theta)
        uniforms['sunPosition'].value.copy(sun)
        this.scene.add(sky)
    }

    async load() {
        // tank model
        this.tankModelBottom = await loadTankBottom()
        this.tankModelTop = await loadTankTop()

        // plane model
        this.planeModel = await loadPlane()

        // renderer
        this.renderer = new WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(window.devicePixelRatio / 2);
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer!.shadowMap.enabled = true
        this.renderer.shadowMap.type = PCFSoftShadowMap
        document.body.appendChild(this.renderer.domElement)

        // map model
        const obj_map = await loadMap()
        this.map = initMap(obj_map)
        this.map.forEach((each) => {
            const material = new MeshPhongMaterial();
            material.color = new Color(0xd9f1ff);
            const mesh = new Mesh(each, material)
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

        // pointer
        this.context.strokeStyle = "#FF0000FF"
        this.context.lineWidth = 2
        this.context.beginPath()
        this.context.arc(this.canvas.width / 2, this.canvas.height / 2, 5, 0, 2 * Math.PI)
        this.context.stroke()
        // ranking
        this.ranking.onRender2D(this.context)
        // joystick
        this.touch.onRender2D(this.context)
        // death
        if (!this.alive) {
            drawText("You dead")
        }
        // chat
        this.chat.onRender2D(this.context, this.canvas.width, this.canvas.height)
        // network
        if (!this.network.isConnected()) {
            drawText("Server Connection Lost")
        }
    }

    kill() {
        if (!this.alive) return
        this.network.send(new PacketDie())
        this.network.send(new PacketRemoveTank())
        this.alive = false

        // respawn
        setTimeout(() => {
            this.alive = true
            this.thePlayer!.removeEntity()
            if (Math.random() > 0.5) {
                this.thePlayer = new Tank(true, "")
            } else {
                this.thePlayer = new Plane(true, "")
            }
            this.thePlayer!.addEntity()
            this.thePlayer!.randomPos()
        }, RESPAWN);
    }

    start() {
        this.thePlayer = new Tank(true, "")
        this.thePlayer.addEntity()

        const updateKeys = (e: KeyboardEvent, pressed: boolean) => {
            if ((this.keys as any)[e.key] !== undefined)
                (this.keys as any)[e.key] = pressed
            if (e.key === " ")
                this.keys.space = pressed
            if (e.key.startsWith("Arrow")) {
                (this.keys as any)["a" + e.key.replace("Arrow", "").toLowerCase()] = pressed
            }
        }

        // controls
        document.body.addEventListener("keydown", (e) => {
            updateKeys(e, true)
            this.chat.onKeyPress(e)
        })
        document.body.addEventListener("keyup", (e) => {
            updateKeys(e, false)
        })
        document.body.addEventListener("mousemove", (e) => {
            if (!this.touch.isEnabled()) {
                this.mouseX += e.movementX
                this.mouseY += e.movementY
            }
        })
        document.body.addEventListener("mousedown", () => {
            if (document.pointerLockElement === document.body) this.keys.left = true
        })
        document.body.addEventListener("mouseup", () => {
            if (document.pointerLockElement === document.body) this.keys.left = false
        })
        this.canvas.onclick = () => {
            if (!this.touch.isEnabled())
                document.body.requestPointerLock()
        }

        // set username
        document.getElementById("btn_name")?.addEventListener("click", () => {
            let name = prompt("Username:")
            if (name !== null) this.name = (name.length < 20 ? name : "我妈死了 我要炸房")
            this.network.updateUsername()
        })

        // touch screen
        this.touch = new Touch(document.getElementById("2d") as HTMLCanvasElement)
        document.getElementById("btn_touch")?.addEventListener("click", () => {
            this.touch.enable()
        
            // disable text selection
            this.renderer!.domElement.onselectstart = () => false
        })

        // plane swap W-S
        document.getElementById("btn_plane_swap_w_s")?.addEventListener("click", () => {
            this.plane_swap_w_s = !this.plane_swap_w_s
        })

        // game loop
        setInterval(() => this.onTick(), 1000 / TPS)
        requestAnimationFrame(() => this.onRender())

        this.network.connect()
        this.thePlayer!.randomPos() // spawn player

    }

    onTick() {
        // using arrow keys to rotate
        const ARROW_SPEED = 20
        if (this.keys.aleft)
            this.mouseX -= ARROW_SPEED
        if (this.keys.aright)
            this.mouseX += ARROW_SPEED
        if (this.keys.aup)
            this.mouseY -= ARROW_SPEED
        if (this.keys.adown)
            this.mouseY += ARROW_SPEED

        // update balls
        this.balls.forEach((ball) => {
            ball.update()
        })
        this.remoteBalls.forEach((ball) => {
            ball.update()
        })

        // update network
        this.network.update()

        // input chat
        if (this.chat.input) return
        if (this.keys.t) this.chat.input = true

        // joystick input
        this.touch.update()

        // update
        this.thePlayer!.update()
        this.thePlayer!.updateCamera()

        // shot
        if (this.alive && (this.keys.space || this.keys.left)) {
            this.thePlayer!.shot()
        }

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
