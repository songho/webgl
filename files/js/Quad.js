///////////////////////////////////////////////////////////////////////////////
// Quad.js
// =======
// a 2D rectangle model with 4 edges (left, right, bottom, top) for WebGL
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-01
// UPDATED: 2021-07-09
///////////////////////////////////////////////////////////////////////////////

//let QuadVertices = new Float32Array(4 * 2);                 // 4 vertices
//let QuadTexCoords = new Float32Array([0,0, 1,0, 1,1, 0,1]); // 4 vertices

let Quad = function(gl, left, right, bottom, top)
{
    this.gl = gl;
    if(!gl)
        log("[ERROR] Quad.contructor requires GL context as a param.");

    // set with unit square if not specified
    this.left = left || -0.5;
    this.right = right || 0.5;
    this.bottom = bottom || -0.5;
    this.top = top || 0.5;
    this.reversed = false;          // top-to-bottom tex orientation by default

    this.vbo = gl.createBuffer();
    this.initVbo();
};

Quad.prototype =
{
    initVbo: function()
    {
        // interleaved
        // default tex orientation is top-to-bottom
        let vertices = new Float32Array(4*4);
        vertices[0] = this.left;    vertices[1] = this.bottom;  vertices[2] = 0;    vertices[3] = 1;
        vertices[4] = this.right;   vertices[5] = this.bottom;  vertices[6] = 1;    vertices[7] = 1;
        vertices[8] = this.right;   vertices[9] = this.top;     vertices[10]= 1;    vertices[11]= 0;
        vertices[12]= this.left;    vertices[13]= this.top;     vertices[14]= 0;    vertices[15]= 0;

        // reverse orientation
        if(this.reversed)
        {
            vertices[3] = 0;
            vertices[7] = 0;
            vertices[11]= 1;
            vertices[15]= 1;
        }

        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    },
    set: function(left, right, bottom, top)
    {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.initVbo();
        return this;
    },
    reverseTextureOrientation: function()
    {
        this.reversed = !this.reversed;
        this.initVbo();
    },
    draw: function()
    {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord0, 2, gl.FLOAT, false, 16, 8);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        return this;
    }
};

