const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
const noOfP : number = 4
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const color : string = "#673AB7"
const backColor : string = "#BDBDBD"
const sizeFactor : number = 3

const maxScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.max(0, scale - i / n)
}
const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(1/n, scale - i / n) * n
}
const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)
const mirrorValue : Function = (scale : number, a : number, b : number) => {
    const k : number = scaleFactor(scale)
    return (1 - k) / a + k / b
}
const updateScale : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return mirrorValue(scale, a, b) * dir * scGap
}

const drawArc : Function = (context : CanvasRenderingContext2D, y : number, r : number, start : number, end : number, scale : number) => {
    var deg : number = start + (end - start) * scale
    var k : number = 0
    var dir = 1
    if (start > end) {
        dir = -1
    }
    context.save()
    context.translate(0, y)
    context.beginPath()
    context.moveTo(r * Math.cos(start * Math.PI/180), r * Math.sin(start * Math.PI/180))
    while (k != deg) {
        context.lineTo(r * Math.cos(k * Math.PI/180), r * Math.cos(k * Math.PI/180))
        k += dir
    }
    context.stroke()
    context.restore()
}

const drawDSPNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = w / (nodes + 1)
    const size : number = gap / sizeFactor
    context.strokeStyle = color
    context.lineCap = 'round'
    context.lineWidth = Math.min(w, h) / strokeFactor
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    const r : number = size / noOfP
    var deg : number = -90
    context.save()
    context.translate(gap * (i + 1), h / 2)
    context.beginPath()
    context.moveTo(0, -size)
    context.lineTo(0, size)
    context.stroke()
    for (var j = 0; j < noOfP; j++) {
        const si : number = j % 2
        const sf : number = 1 - 2 * si
        const sc : number = divideScale(scale, j, noOfP)
        drawArc(context, -size + r + r * j, r, deg, deg + 180 * sf, sc * sf)
    }
    context.restore()
}

class DoubleSidePStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : DoubleSidePStage = new DoubleSidePStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}
