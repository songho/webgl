///////////////////////////////////////////////////////////////////////////////
// PenTool.js
// ==========
// drawing strokes on OpenGL canvas as 2D
// The vertical orientation is bottom to top.
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-07-21
// UPDATED: 2020-09-30
///////////////////////////////////////////////////////////////////////////////

const PEN_WIDTH = 10;                               // point size (diameter)
const PEN_COLOR = new Float32Array([0, 0, 0, 1]);   // (r,g,b,a)
const PEN_TOOL_BLOCK_SIZE = 128;                    // # of 2D points in a block

let PenTool = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[ERROR] PenTool.contructor requires GL context as a param.");

    //this.shader = null;
    this.vbo = gl.createBuffer();
    this.points = null;
    this.pointCount = 0;
    this.pointCapacity = PEN_TOOL_BLOCK_SIZE;
    this.stroke = {};               // current stroke
    this.stroke.color = PEN_COLOR;
    this.stroke.width = PEN_WIDTH;  // diameter
    this.stroke.start = 0;          // 0-based
    this.stroke.end = 0;
    this.strokes = [];
    this.prevX = null;
    this.prevY = null;

    this.reset();
};

PenTool.prototype =
{
    setWidth: function(width)
    {
        this.stroke.width = width;
    },
    setColor: function(r, g, b, a)
    {
        this.stroke.color[0] = r;
        this.stroke.color[1] = g;
        this.stroke.color[2] = b;
        this.stroke.color[3] = a;
    },
    //setShader: function(program)
    //{
    //    this.shader = program;
    //},
    reset: function()
    {
        // reset vertex buffer to initial size
        this.points = new Float32Array(PEN_TOOL_BLOCK_SIZE * 2); // (x,y)
        this.pointCount = 0;
        this.pointCapacity = PEN_TOOL_BLOCK_SIZE;
        this.strokes.length = 0;
        this.resizeVbo();
    },
    undo: function()
    {
        if(this.strokes.length < 1)
            return;

        let strokeDelete = this.strokes.pop();
        let strokeLast = this.strokes[this.strokes.length - 1];
        if(strokeLast)
        {
            this.pointCount = strokeLast.end + 1;
            this.stroke.start = strokeLast.start;
        }
        else
        {
            this.pointCount = 0;
            this.stroke.start = 0;
        }
    },
    increaseBuffer: function(targetSize)
    {
        // add blocks of buffer
        while(this.pointCapacity < targetSize)
            this.pointCapacity += PEN_TOOL_BLOCK_SIZE;
        let buffer = new Float32Array(this.pointCapacity * 2);

        // copy prev contents
        for(let i = 0; i < this.points.length; ++i)
            buffer[i] = this.points[i];

        this.points = buffer;
        this.resizeVbo();
        //log("new bufferSize: " + this.pointCapacity);
    },
    resizeVbo: function()
    {
        if(!this.gl)
            return null;
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.DYNAMIC_DRAW);
    },
    updateVbo: function()
    {
        if(!this.gl)
            return null;
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.points);
    },
    startAt: function(x, y)
    {
        if((this.pointCount + 1) >= this.pointCapacity)
            this.increaseBuffer(this.pointCount + 1);

        let index = this.pointCount * 2;
        this.points[index] = x;
        this.points[index+1] = y;

        this.stroke.start = this.pointCount;
        if(this.strokes.length > 0)
            this.strokes[this.strokes.length - 1].end = this.pointCount - 1;

        this.prevX = x;
        this.prevY = y;
        ++this.pointCount;

        // copy stroke to new one
        this.strokes.push(this.stroke);
        let stroke = {};
        stroke.color = new Float32Array(this.stroke.color);
        stroke.width = this.stroke.width;
        this.stroke = stroke;   // reassign

        this.updateVbo();
        //log("started: (" + x + ", " + y + ") index=" + this.strokes[this.strokes.length-1].start);
    },
    moveTo: function(x, y)
    {
        // compute # of points
        let dx = x - this.prevX;
        let dy = y - this.prevY;
        let d = Math.sqrt(dx * dx + dy * dy);
        if(d < 1)
            return;

        let count = Math.max(Math.ceil(d / this.stroke.width * 3), 1);
        if((this.pointCount + count) >= this.pointCapacity)
            this.increaseBuffer(this.pointCount + count);
        //log("new # of points: " + count);

        // add points
        let index = this.pointCount * 2;
        let fact = 0;
        for(let i = 1; i <= count; ++i)
        {
            fact = i / count;
            this.points[index]   = this.prevX + (dx * fact);
            this.points[index+1] = this.prevY + (dy * fact);
            this.pointCount++;
            //log("point: (" + this.points[index] + ", " + this.points[index+1] + ") count=" + this.pointCount);

            // next index
            index += 2;
        }

        // remember the current point
        this.prevX = x;
        this.prevY = y;
        this.updateVbo();
    },
    draw: function()
    {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 2, gl.FLOAT, false, 0, 0);

        let stroke;
        for(let i = 0; i < this.strokes.length-1; ++i)
        {
            stroke = this.strokes[i];

            // set color and width
            gl.uniform1f(gl.program.uniform.pointSize, stroke.width);
            gl.uniform4fv(gl.program.uniform.color, stroke.color);

            gl.drawArrays(gl.POINTS, stroke.start, stroke.end - stroke.start + 1);
        }

        // last stroke
        stroke = this.strokes[this.strokes.length - 1];
        if(stroke)
        {
            gl.uniform1f(gl.program.uniform.pointSize, stroke.width);
            gl.uniform4fv(gl.program.uniform.color, stroke.color);
            gl.drawArrays(gl.POINTS, stroke.start, this.pointCount - stroke.start);
        }
    }
};
