import { Group, Matrix4, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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

const laod_glft = (name: string) => {
    return new Promise<Group>((resolve) => {
        const loader = new GLTFLoader()
        loader.load(name, (obj) => {
            resolve(obj.scene)
        })
    })
}

export async function loadTankBottom() {
    const obj = await load_obj("tank_bottom.obj")
    obj.children.forEach((child) => {
        (child as Mesh).material = new MeshPhongMaterial({ color: 0x00a000 })
    })
    obj.scale.set(0.5, 0.5, 0.5)
    return obj.clone()
}

export async function loadTankTop() {
    const obj = await load_obj("tank_top.obj")
    obj.children.forEach((child) => {
        (child as Mesh).material = new MeshPhongMaterial({ color: 0x00a000 })
    })
    obj.scale.set(0.5, 0.5, 0.5)
    return obj.clone()
}

export async function loadPlane() {
    const obj = await load_obj("plane.obj")
    obj.children.forEach((child) => {
        (child as Mesh).material = new MeshPhongMaterial({ color: 0x00a000 })
    })
    obj.scale.set(0.5, 0.5, 0.5)
    return obj.clone()
}

export async function loadMap() {
    return await load_obj("map.obj")
}