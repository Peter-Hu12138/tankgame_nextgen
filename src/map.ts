import { Box3, BufferGeometry, Group, Mesh } from "three";

export function initMap(obj: Group) {
    let map = new Array<BufferGeometry>()
    obj.children.forEach((child) => {
        let mesh = child as Mesh
        map.push(mesh.geometry)
    })
    return map
}

export function initBoundingBoxes(map: Array<BufferGeometry>) {
    let boxes = new Array<Box3>()
    map.forEach((each) => {
        each.computeBoundingBox()
        boxes.push(each.boundingBox!)
    })
    return boxes
}