///////////////////////////////////////////////////////////////////////////////
// LineSegment.js
// ==============
// WebGL line drawing with line width
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2021-07-09
///////////////////////////////////////////////////////////////////////////////

let LineVertices = new Float32Array(6 * 3); // 6 vertices

let LineSegment = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] Line.contructor requires GL context as a param.");

    this.vbo = gl.createBuffer();
    this.width = 1;
    this.widthRatio = 1;
};

LineSegment.prototype =
{
    setWidth: function(w, r)
    {
        this.width = w;
        this.widthRatio = r || 1;
        return this;
    },

    ///////////////////////////////////////////////////////////////////////////
    // draw a line with its thickness
    ///////////////////////////////////////////////////////////////////////////
    draw: function(x1, y1, z1, x2, y2, z2)
    {
        let gl = this.gl;
        if(this.width <= 1)
        {
            LineVertices[0] = x1;
            LineVertices[1] = y1;
            LineVertices[2] = z1;

            LineVertices[3] = x2;
            LineVertices[4] = y2;
            LineVertices[5] = z2;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, LineVertices, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 2);
        }
        else
        {
            let a = new Vector3(x2-x1, y2-y1, z2-z1);
            a.normalize();
            let b = new Vector3(0, 0, 1);   // temp perpendicular vector
            if(Math.abs(a.x) < Math.abs(a.y))
            {
                if(Math.abs(a.x) < Math.abs(a.z))
                    b.set(1, 0, 0);
            }
            else
            {
                if(Math.abs(a.y) < Math.abs(a.z))
                    b.set(0, 1, 0);
            }
            let c = Vector3.cross(b, a);    // unit perpendicular vector

            let w = this.width * this.widthRatio * 0.5; // half width
            let d1 = c.clone().scale(w);                // delta side
            let d2 = a.clone().scale(w);                // delta forward

            LineVertices[0] = x1 + d1.x;
            LineVertices[1] = y1 + d1.y;
            LineVertices[2] = z1 + d1.z;

            LineVertices[3] = x1 - d2.x;
            LineVertices[4] = y1 - d2.y;
            LineVertices[5] = z1 - d2.z;

            LineVertices[6] = x1 - d1.x;
            LineVertices[7] = y1 - d1.y;
            LineVertices[8] = z1 - d1.z;

            LineVertices[9] = x2 - d1.x;
            LineVertices[10]= y2 - d1.y;
            LineVertices[11]= z2 - d1.z;

            LineVertices[12]= x2 + d2.x;
            LineVertices[13]= y2 + d2.y;
            LineVertices[14]= z2 + d2.z;

            LineVertices[15]= x2 + d1.x;
            LineVertices[16]= y2 + d1.y;
            LineVertices[17]= z2 + d1.z;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, LineVertices, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
        }
        return this;
    }
};

