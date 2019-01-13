const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
const noOfP : number = 4
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const color : string = "#673AB7"
const backColor : string = "#BDBDBD"
const sizeFactor : number = 2

const maxScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.max(0, scale - (i / n))
}
const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(1/n, maxScale(scale, i, n)) * n
}
const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)
const mirrorValue : Function = (scale : number, a : number, b : number) => {
    const k : number = scaleFactor(scale)
    return (1 - k) / a + k / b
}
const updateScale : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return mirrorValue(scale, a, b) * dir * scGap
}

const drawArc : Function = (context : CanvasRenderingContext2D, y : number, r : number, start : number, end : number, dir : number) => {
    if (start == end) {
        return
    }
    context.save()
    context.translate(0, y)
    context.beginPath()
    context.moveTo(r * Math.cos(start * Math.PI/180), r * Math.sin(start * Math.PI/180))
    for (var i = start; i <= end; i++) {
        context.lineTo(r * Math.cos(i * Math.PI/180) * dir, r * Math.sin(i * Math.PI/180))
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
    context.rotate((Math.PI / 2) * sc2)
    context.beginPath()
    context.moveTo(0, -size)
    context.lineTo(0, size)
    context.stroke()
    for (var j = 0; j < noOfP; j++) {
        const si : number = j % 2
        const sf : number = 1 - 2 * si
        const sc : number = divideScale(sc1, j, noOfP)
        const endDeg : number = deg + 180
        const endScDeg : number = deg + (endDeg - deg) * sc
        drawArc(context, -size + r + 2 * r * j, r, deg, endScDeg, sf)
    }
    context.restore()
}

class DoubleSidePStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        console.log("starting to render")
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : DoubleSidePStage = new DoubleSidePStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += updateScale(this.scale, this.dir, noOfP, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class DSPNode {
    prev : DSPNode
    next : DSPNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new DSPNode(this.i + 1)
            this.next.prev = this
        }
        console.log(this.next)
        console.log(this.prev)
    }

    draw(context : CanvasRenderingContext2D) {
        console.log(`starting to draw ${this.i}`)
        drawDSPNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
        console.log(`drawn ${this.i}`)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : DSPNode {
        var curr : DSPNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class DoubleSideP {

    root : DSPNode = new DSPNode(0)
    curr : DSPNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    dsp : DoubleSideP = new DoubleSideP()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.dsp.draw(context)
    }

    handleTap(cb : Function) {
        this.dsp.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.dsp.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
