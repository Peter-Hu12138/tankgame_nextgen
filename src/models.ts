import { Group, Matrix4, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

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

export async function loadTank() {
    const obj = await load_obj("tank.obj")
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
    let obj_map = await load_obj("map.obj")
    obj_map.applyMatrix4(new Matrix4().scale(new Vector3(2, 2, 2)))
    return obj_map
}