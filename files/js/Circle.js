///////////////////////////////////////////////////////////////////////////////
// Circle.js
// =========
// By default, it create a unit circle (r=1) at origin (0,0,0)
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2015-04-17
// UPDATED: 2025-05-10
///////////////////////////////////////////////////////////////////////////////

let CIRCLE_SEGMENTS = 64;

let Circle = function(gl, c, r, s)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] Circle.contructor requires GL context as a param.");

    this.center = c || new Vector3(0,0,0);
    this.radius = r || 1;
    this.segmentCount = s || CIRCLE_SEGMENTS;
    //this.matrix = new Matrix4();
    //this.matrix.identity();
    this.vboVertex = gl.createBuffer();
    this.vboIndex = gl.createBuffer();
    this.generateVertices();
};

Circle.prototype =
{
    set: function(c, r, s=CIRCLE_SEGMENTS)
    {
        this.center.set(c.x, c.y, c.z);
        this.radius = r;
        this.segmentCount = s;
        this.generateVertices();
        return this;
    },
    setCenter: function(c)
    {
        this.center.set(c.x, c.y, c.z);
        this.generateVertices();
        return this;
    },
    setRadius: function(r)
    {
        this.radius = r;
        this.generateVertices();
        return this;
    },
    setSegmentCount: function(s)
    {
        this.segmentCount = s;
        this.generateVertices();
        return this;
    },
    toString: function()
    {
        return "Circle(c=(" + this.center.x + ", " + this.center.y + ", " + this.center.z + "), " + "r=" +this.radius + ")";
    },

    ///////////////////////////////////////////////////////////////////////////
    // create vertices for circles
    ///////////////////////////////////////////////////////////////////////////
    generateVertices: function()
    {
        let gl = this.gl;
        let vertices = new Float32Array(this.segmentCount * 3);
        let indices = new Uint16Array(this.segmentCount * 2);

        // set vertex list
        let i, j, k;
        let angle = 0;                          // in radian
        let pi2r = Math.PI * 2 / this.segmentCount;
        for(i = j = k = 0; i < this.segmentCount; ++i, j+=3, k+=2)
        {
            angle = pi2r * i;
            vertices[j]   = this.radius * Math.cos(angle) + this.center.x;
            vertices[j+1] = this.radius * Math.sin(angle) + this.center.y;
            vertices[j+2] = 0;

            indices[k]   = i;
            indices[k+1] = i+1;
        }
        // override the last index
        indices[this.segmentCount*2-1] = 0; // index of first vertex

        // copy vertices to VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboVertex);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // copy indices to VBO
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboIndex);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },

    ///////////////////////////////////////////////////////////////////////////
    // draw line
    ///////////////////////////////////////////////////////////////////////////
    draw: function()
    {
        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboVertex);
        gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboIndex);
        gl.drawElements(gl.LINES, this.segmentCount*2, gl.UNSIGNED_SHORT, 0);

        /*
        gl.lineWidth(this.width);

        LineVertices[0] = x1;     LineVertices[1] = y1;     LineVertices[2] = z1; // p1
        LineVertices[3] = x2;     LineVertices[4] = y2;     LineVertices[5] = z2; // p2

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, LineVertices, gl.DYNAMIC_DRAW);
        //gl.bufferSubData(gl.ARRAY_BUFFER, 0, LineVertices);
        gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 2);
        */

        return this;
    }
};

