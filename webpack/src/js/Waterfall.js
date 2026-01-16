export default class Waterfall {
    constructor(canvas, player) {
        this.canvas = canvas
        this.player = player
        this.canvasContext = canvas.getContext("2d")
        this.canvasBuffer = document.createElement("canvas")
        this.canvasBufferContext = this.canvasBuffer.getContext("2d")
        this.notes = new Set()
        // this.spark = [new Image(), new Image()]
        // this.spark[0].src = './assets/flame.png';
        // this.spark[1].src = './assets/flame.png';
        this.events = []
        this.rendering = false
    }
    onFrame() {
        if (this.rendering) {
            this.last = new Date().getTime()
            if (!this.width || !this.height) {
                this.width = this.canvas.clientWidth
                this.height = this.canvas.clientHeight
                this.canvas.width = this.width
                this.canvas.height = this.height
                this.canvasBuffer.width = this.width
                this.canvasBuffer.height = this.height
            }
            this.tick()
            window.requestAnimationFrame(this.onFrame.bind(this))
        }
    }
    setVisible(show) {
        this.rendering = show
        if (show) {
            this.onFrame()
        }
    }
    tick() {
        let { baseTime, splice } = this.player.refreshWaterfallEvents(this.events)
        this.events.splice(0, splice)
        let events = this.player.addWaterfallEvents(baseTime)
        this.events.push(...events)
        let baseGapTime = this.player.getBaseGapTime()
        if (this.width && this.height)
            this.draw(this.events, baseTime, baseGapTime)
        return baseTime
    }
    resetEvents(events) {
        this.events = events
        if (this.rendering)
            this.tick()
    }
    getNotePosition(noteNumber) {
        let whiteWidth = this.width / 52
        let blackWidth = whiteWidth / 2
        let left = - this.width / 52 * 12
        let octave = Math.floor(noteNumber / 12)
        let step = noteNumber % 12
        let isWhite = step < 5 ? (step % 2 == 0) : (step % 2 == 1)
        let index = isWhite ? Math.floor((step + 1) / 2) : Math.floor(step / 2)
        if (isWhite) {
            return { x: left + octave * whiteWidth * 7 + whiteWidth * index, width: whiteWidth }
        } else {
            return { x: left + octave * whiteWidth * 7 + whiteWidth * index + whiteWidth - blackWidth / 2, width: blackWidth }
        }
    }
    draw(events, startTime, baseGapTime) {
        const ctx = this.canvasBufferContext
        const width = this.width
        const height = this.height
        ctx.fillStyle = "#000231"
        ctx.fillRect(0, 0, width, height)

        events.forEach(event => {
            let yEnd = height - height * (event.time - startTime) / baseGapTime
            if (event.type == "measure") {
                ctx.save()
                ctx.strokeStyle = "#0000ff"
                ctx.beginPath()
                ctx.setLineDash([5, 15])
                ctx.moveTo(0, yEnd)
                ctx.lineTo(width, yEnd)
                ctx.stroke()
                ctx.restore()
            }
        })
        events.forEach(event => {
            let yEnd = height - height * (event.time - startTime) / baseGapTime
            if (event.type == "notes") {
                event.noteEvents.forEach(note => {
                    let noteHeight = height * note.delay / baseGapTime
                    let noteInfo = this.getNotePosition(note.noteNumber)
                    let color = this.notes.has(note.noteNumber) && event.time < startTime ? "#9cf6fc" : "#4a9cd0"
                    ctx.save()
                    this.drawRoundRect(ctx, noteInfo.x, yEnd - noteHeight, noteInfo.width, noteHeight, 4, color)
                    ctx.restore()
                })
            }
        })

        // this.notes.forEach(note => {
        //     let noteInfo = this.getNotePosition(note)

        //     ctx.save()
        //     ctx.drawImage(this.spark[0], noteInfo.x, height - 20, noteInfo.width, 20)
        //     ctx.restore()
        // })

        this.canvasContext.drawImage(this.canvasBuffer, 0, 0)
    }
    drawRoundRect(cxt, x, y, width, height, radius, color) {
        cxt.beginPath()
        cxt.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2)
        cxt.lineTo(width - radius + x, y)
        cxt.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2)
        cxt.lineTo(width + x, height + y - radius)
        cxt.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2)
        cxt.lineTo(radius + x, height + y)
        cxt.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI)
        cxt.closePath()
        cxt.fillStyle = color
        cxt.strokeStyle = color
        cxt.fill()
    }
    noteOn(note) {
        this.notes.add(note)
    }
    noteOff(note) {
        this.notes.delete(note)
    }
}