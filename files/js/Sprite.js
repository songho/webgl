///////////////////////////////////////////////////////////////////////////////
// Sprite.js
// =========
// 2D billboard class
// depends on Vector3, Vector4 (Vectors.js), Matrix4 (Matrices.js)
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-06
// UPDATED: 2021-07-09
///////////////////////////////////////////////////////////////////////////////

let Sprite = function(gl)
{
    this.gl = gl;
    if(gl)
    {
        this.vboVertex = gl.createBuffer();
    }
    else
    {
        this.vboVertex = null;
        log("[WARNING] Sprite.contructor requires GL context as a param.");
    }

    this.width = 0;
    this.height = 0;
    this.texId = null;
    this.texCoords = new Vector4(0,0, 1,1); // s1,t1, s2,t2
    this.color = new Vector4(1, 1, 1, 1);
    this.matrix = new Matrix4();
    this.matrix.identity();
};

Sprite.prototype =
{
    setPosition: function(x, y, z)
    {
        this.matrix.setTranslation(x || 0, y || 0, z || 0);
        return this;
    },
    getPosition: function()
    {
        return new Vector3(this.matrix.m[12], this.matrix.m[13], this.matrix.m[14]);
    },
    setSize: function(w, h)
    {
        let gl = this.gl;

        if(!this.vboVertex)
            this.vboVertex = gl.createBuffer();

        this.width = w || 0;
        this.height = h || 0;

        let vertices = new Float32Array(4 * 5);

        // interleaved triangle strip (vertex and texCoords) at origin
        vertices[0] = -this.width*0.5;  vertices[1] = this.height*0.5;  vertices[2] = 0;
        vertices[3] = this.texCoords.x; vertices[4] = this.texCoords.y;

        vertices[5] = -this.width*0.5;  vertices[6] = -this.height*0.5; vertices[7]= 0;
        vertices[8] = this.texCoords.x; vertices[9] = this.texCoords.w;

        vertices[10]= this.width*0.5;   vertices[11]= this.height*0.5;  vertices[12]= 0;
        vertices[13]= this.texCoords.z; vertices[14]= this.texCoords.y;

        vertices[15]= this.width*0.5;   vertices[16]= -this.height*0.5; vertices[17]= 0;
        vertices[18]= this.texCoords.z; vertices[19]= this.texCoords.w;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboVertex);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return this;
    },
    setColor: function(r, g, b, a)
    {
        this.color.set(r, g, b, a);
        return this;
    },
    setTexture: function(texId)
    {
        this.texId = texId;
        return this;
    },
    setTexCoords: function(s1, t1, s2, t2)
    {
        this.texCoords.set(s1, t1, s2, t2);
        return this;
    },
    bindTexture: function()
    {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texId);
        return this;
    },
    unbindTexture: function()
    {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.disableVertexAttribArray(this.gl.program.attribute.vertexTexCoord0);
        return this;
    },
    draw: function()
    {
        if(!this.vboVertex) return false;

        let gl = this.gl;

        gl.uniformMatrix4fv(gl.program.uniform.matrixModel, false, this.matrix.m);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboVertex);
        gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord0, 2, gl.FLOAT, false, 20, 3*4);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return this;
    },
    toString: function()
    {
        return "===== Sprite =====\n" +
               " Position: (" + this.matrix.m[12] + ", " + this.matrix.m[13] + ", " + this.matrix.m[14] + ")\n" +
               "    Width: " + this.width + "\n" +
               "   Height: " + this.height + "\n" +
               "TexCoords: " + this.texCoords + "\n";
    }
};

