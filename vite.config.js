/** @type {import("vite").UserConfig} */
export default {
    base: "/tankgame/",
    server: {
        proxy: {
            "/tankgamews": {
                ws: true,
                target: "ws://127.0.0.1:8080/"
            }
        }
    }
}