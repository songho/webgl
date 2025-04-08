///////////////////////////////////////////////////////////////////////////////
// Torus.js
// ========
// With default constructor, it creates a torus with majorRadius=1,
// minorRadius=0.5, sectorCount=36, sideCount=18, smooth=true.
// The minimum # of sectors is 3 and sides is 2.
//
// Example of OpenGL drawing calls (interleaved mode)
// ===============================
//  gl.bindBuffer(gl.ARRAY_BUFFER, torus.vboVertex);
//  gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 32, 0);
//  gl.vertexAttribPointer(gl.program.attribute.vertexNormal, 3, gl.FLOAT, false, 32, 12);
//  gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord, 2, gl.FLOAT, false, 32, 24);
//  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torus.vboIndex);
//  gl.drawElements(gl.TRIANGLES, torus.getIndexCount(), gl.UNSIGNED_SHORT, 0);
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2023-03-15
// UPDATED: 2024-05-21
///////////////////////////////////////////////////////////////////////////////

let Torus = function(gl, majorRadius=1, minorRadius=0.5, sectors=36, sides=18, smooth=true)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] Torus.contructor requires GL context as a param.");

    this.majorRadius = 1;
    this.minorRadius = 0.5;
    this.sectorCount = 36;
    this.sideCount = 18;
    this.smooth = true;
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.indices = [];
    this.interleavedVertices = [];
    this.stride = 32;   // stride for interleaved vertices, always=32
    if(gl)
    {
        this.vboVertex = gl.createBuffer();
        this.vboIndex = gl.createBuffer();
    }
    // init
    this.set(majorRadius, minorRadius, sectors, sides, smooth);
};

Torus.prototype =
{
    set: function(R, r, se, si, sm)
    {
        this.majorRadius = R;
        this.minorRadius = r;
        this.sectorCount = se;
        if(se < 3)
            this.sectorCount = 3;
        this.sideCount = si;
        if(si < 2)
            this.sideCount = 2;
        this.smooth = sm;
        if(sm)
            this.buildVerticesSmooth();
        else
            this.buildVerticesFlat();
        return this;
    },
    setMajorRadius: function(r)
    {
        if(this.majorRadius != r)
            this.set(r, this.minorRadius, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setMinorRadius: function(r)
    {
        if(this.minorRadius != r)
            this.set(this.majorRadius, r, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setSectorCount: function(s)
    {
        if(this.sectorCount != s)
            this.set(this.majorRadius, this.minorRadius, s, this.sideCount, this.smooth);
        return this;
    },
    setSideCount: function(s)
    {
        if(this.sideCount != s)
            this.set(this.majorRadius, this.minorRadius, this.sectorCount, s, this.smooth);
        return this;
    },
    setSmooth: function(s)
    {
        if(this.smooth != s)
        {
            this.smooth = s;
            if(this.smooth)
                this.buildVerticesSmooth();
            else
                this.buildVerticesFlat();
        }
        return this;
    },
    reverseNormals: function()
    {
        let i, j;
        let count = this.normals.length;
        for(i = 0, j = 3; i < count; i+=3, j+=8)
        {
            this.normals[i]   *= -1;
            this.normals[i+1] *= -1;
            this.normals[i+2] *= -1;

            this.interleavedVertices[j]   = this.normals[i];
            this.interleavedVertices[j+1] = this.normals[i+1];
            this.interleavedVertices[j+2] = this.normals[i+2];
        }

        let tmp;
        count = this.indices.length;
        for(i = 0; i < count; i+=3)
        {
            tmp = this.indices[i];
            this.indices[i]   = this.indices[i+2];
            this.indices[i+2] = tmp;
        }

        this.buildVbos();
    },
    getTriangleCount: function()
    {
        return this.getIndexCount() / 3;
    },
    getIndexCount: function()
    {
        return this.indices.length;
    },
    getVertexCount: function()
    {
        return this.vertices.length / 3;
    },
    getNormalCount: function()
    {
        return this.normals.length / 3;
    },
    getTexCoordCount: function()
    {
        return this.texCoords.length / 2;
    },
    toString: function()
    {
        return "===== Torus =====\n" +
               "  Major Radius: " + this.majorRadius + "\n" +
               "  Minor Radius: " + this.minorRadius + "\n" +
               "  Sector Count: " + this.sectorCount + "\n" +
               "    Side Count: " + this.sideCount + "\n" +
               " Smooth Shader: " + this.smooth + "\n" +
               "Triangle Count: " + this.getTriangleCount() + "\n" +
               "   Index Count: " + this.getIndexCount() + "\n" +
               "  Vertex Count: " + this.getVertexCount() + "\n" +
               "  Normal Count: " + this.getNormalCount() + "\n" +
               "TexCoord Count: " + this.getTexCoordCount() + "\n";
    },

    clearArrays: function()
    {
        this.vertices.length = 0;
        this.normals.length = 0;
        this.texCoords.length = 0;
        this.indices.length = 0;
        this.interleavedVertices.length = 0;
    },
    resizeArraysSmooth: function()
    {
        this.clearArrays();
        let count = (this.sectorCount + 1) * (this.sideCount + 1);
        this.vertices = new Float32Array(3 * count);
        this.normals = new Float32Array(3 * count);
        this.texCoords = new Float32Array(2 * count);
        this.indices = new Uint16Array(6 * this.sectorCount * this.sideCount);
    },
    resizeArraysFlat: function()
    {
        this.clearArrays();
        let count = 4 * this.sectorCount * this.sideCount;
        this.vertices = new Float32Array(3 * count);
        this.normals = new Float32Array(3 * count);
        this.texCoords = new Float32Array(2 * count);
        this.indices = new Uint16Array(6 * this.sectorCount * this.sideCount);
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of torus with smooth shading
    // x = (R + r * cos(u)) * cos(v)
    // y = (R + r * cos(u)) * sin(v)
    // z = r * sin(u)
    // where u: side angle (-180 <= u <= 180)
    //       v: sector angle (0 <= v <= 360)
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesSmooth: function()
    {
        // resize typed arrays
        this.resizeArraysSmooth();

        let x, y, z, xy, nx, ny, nz, s, t, i, j, k, k1, k2, ii, jj, kk;
        let lengthInv = 1.0 / this.minorRadius;
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let sideStep = 2 * Math.PI / this.sideCount;
        let sectorAngle, sideAngle;

        ii = jj = kk = 0;
        for(i=0; i <= this.sideCount; ++i)
        {
            sideAngle = Math.PI - i * sideStep;         // starting from pi to -pi
            xy = this.minorRadius * Math.cos(sideAngle);// r * cos(u)
            z = this.minorRadius * Math.sin(sideAngle); // r * sin(u)

            // add (sectorCount+1) vertices per side
            // the first and last vertices have same position and normal, but different tex coords
            for(j=0; j <= this.sectorCount; ++j)
            {
                sectorAngle = j * sectorStep;           // starting from 0 to 2pi

                // tmp x and y to compute normal vector
                x = xy * Math.cos(sectorAngle);
                y = xy * Math.sin(sectorAngle);

                // add normalized vertex normal first
                nx = x * lengthInv;
                ny = y * lengthInv;
                nz = z * lengthInv;
                this.addNormal(ii, nx, ny, nz);

                // vertex position
                x += this.majorRadius * Math.cos(sectorAngle);  // (R + r * cos(u)) * cos(v)
                y += this.majorRadius * Math.sin(sectorAngle);  // (R + r * cos(u)) * sin(v)
                this.addVertex(ii, x, y, z);

                // vertex tex coord between [0, 1]
                s = j / this.sectorCount;
                t = i / this.sideCount;
                this.addTexCoord(jj, s, t);

                // next
                ii += 3;
                jj += 2;
            }
        }

        // indices
        //  k1--k1+1
        //  |  / |
        //  | /  |
        //  k2--k2+1
        for(i=0; i < this.sideCount; ++i)
        {
            k1 = i * (this.sectorCount + 1);            // beginning of current side
            k2 = k1 + this.sectorCount + 1;             // beginning of next side

            for(j=0; j < this.sectorCount; ++j, ++k1, ++k2)
            {
                // 2 triangles per sector
                this.addIndices(kk, k1, k2, k1+1);  // k1---k2---k1+1
                kk += 3;

                this.addIndices(kk, k1+1, k2, k2+1);// k1+1---k2---k2+1
                kk += 3;
            }
        }

        // generate interleaved vertex array as well
        this.buildInterleavedVertices();
        this.buildVbos();
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of torus with flat shading
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesFlat: function()
    {
        let i, j, k, x, y, z, s, t, n, xy, v1, v2, v3, v4, vi1, vi2, index, ii, jj, kk;
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let sideStep = 2 * Math.PI / this.sideCount;
        let sectorAngle, sideAngle;
        let tmpVertices = [];
        let vertex = {};    // to store (x,y,z,s,t)

        // compute all vertices first, each vertex contains (x,y,z,s,t) except normal
        for(i = 0; i <= this.sideCount; ++i)
        {
            sideAngle = Math.PI - i * sideStep;         // starting from pi to -pi
            xy = this.majorRadius + this.minorRadius * Math.cos(sideAngle); // R + r * cos(u)
            z = this.minorRadius * Math.sin(sideAngle); // r * sin(u)

            // add (sectorCount+1) vertices per side
            // the first and last vertices have same position and normal, but different tex coords
            for(j = 0; j <= this.sectorCount; ++j)
            {
                sectorAngle = j * sectorStep;               // starting from 0 to 2pi
                vertex = {x: xy * Math.cos(sectorAngle),    // x = (R + r * cos(u)) * cos(v)
                          y: xy * Math.sin(sectorAngle),    // y = (R + r * cos(u)) * sin(v)
                          z: z,                             // z = r * sin(u)
                          s: j / this.sectorCount,
                          t: i / this.sideCount};
                tmpVertices.push(vertex);
            }
        }

        // resize typed arrays
        this.resizeArraysFlat();

        ii = jj = kk = index = 0;
        for(i = 0; i < this.sideCount; ++i)
        {
            vi1 = i * (this.sectorCount + 1);               // index of tmpVertices
            vi2 = (i+1) * (this.sectorCount + 1);

            for(j = 0; j < this.sectorCount; ++j, ++vi1, ++vi2)
            {
                // get 4 vertices per sector
                //  v1-v3
                //  |  |
                //  v2-v4
                v1 = tmpVertices[vi1];
                v2 = tmpVertices[vi2];
                v3 = tmpVertices[vi1+1];
                v4 = tmpVertices[vi2+1];

                // store 2 triangles (quad) per side
                // put quad vertices: v1-v2-v3-v4
                this.addVertex(ii,   v1.x, v1.y, v1.z);
                this.addVertex(ii+3, v2.x, v2.y, v2.z);
                this.addVertex(ii+6, v3.x, v3.y, v3.z);
                this.addVertex(ii+9, v4.x, v4.y, v4.z);

                // put tex coords of quad
                this.addTexCoord(jj,   v1.s, v1.t);
                this.addTexCoord(jj+2, v2.s, v2.t);
                this.addTexCoord(jj+4, v3.s, v3.t);
                this.addTexCoord(jj+6, v4.s, v4.t);

                // put normal
                n = Torus.computeFaceNormal(v1.x,v1.y,v1.z, v2.x,v2.y,v2.z, v3.x,v3.y,v3.z);
                this.addNormal(ii,   n[0], n[1], n[2]);
                this.addNormal(ii+3, n[0], n[1], n[2]);
                this.addNormal(ii+6, n[0], n[1], n[2]);
                this.addNormal(ii+9, n[0], n[1], n[2]);

                // put indices of quad (2 triangles)
                this.addIndices(kk,   index, index+1, index+2);
                this.addIndices(kk+3, index+2, index+1, index+3);

                // next
                ii += 12;
                jj += 8;
                kk += 6;
                index += 4;
            }
        }

        // generate interleaved vertex array as well
        this.buildInterleavedVertices();
        this.buildVbos();
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate interleaved vertices: V/N/T
    // stride must be 32 bytes
    ///////////////////////////////////////////////////////////////////////////
    buildInterleavedVertices: function()
    {
        let vertexCount = this.getVertexCount();
        this.interleavedVertices.length = 0;
        this.interleavedVertices = new Float32Array(vertexCount * 8); // v(3)+n(3)+t(2)

        let i, j, k;
        for(i=0, j=0, k=0; i < this.vertices.length; i+=3, j+=2, k+=8)
        {
            this.interleavedVertices[k]   = this.vertices[i];
            this.interleavedVertices[k+1] = this.vertices[i+1];
            this.interleavedVertices[k+2] = this.vertices[i+2];

            this.interleavedVertices[k+3] = this.normals[i];
            this.interleavedVertices[k+4] = this.normals[i+1];
            this.interleavedVertices[k+5] = this.normals[i+2];

            this.interleavedVertices[k+6] = this.texCoords[j];
            this.interleavedVertices[k+7] = this.texCoords[j+1];
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // copy interleaved vertex data to VBOs
    ///////////////////////////////////////////////////////////////////////////
    buildVbos: function()
    {
        let gl = this.gl;
        // copy vertices/normals/texcoords to VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboVertex);
        gl.bufferData(gl.ARRAY_BUFFER, this.interleavedVertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // copy indices to VBO
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboIndex);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },


    ///////////////////////////////////////////////////////////////////////////
    // add vertex, normal, texcoord and indices
    ///////////////////////////////////////////////////////////////////////////
    addVertex: function(index, x, y, z)
    {
        this.vertices[index]   = x;
        this.vertices[index+1] = y;
        this.vertices[index+2] = z;
    },
    addNormal: function(index, x, y, z)
    {
        this.normals[index]   = x;
        this.normals[index+1] = y;
        this.normals[index+2] = z;
    },
    addTexCoord: function(index, s, t)
    {
        this.texCoords[index]   = s;
        this.texCoords[index+1] = t;
    },
    addIndices: function(index, i1, i2, i3)
    {
        this.indices[index]   = i1;
        this.indices[index+1] = i2;
        this.indices[index+2] = i3;
    }
};



///////////////////////////////////////////////////////////////////////////////
// class (static) functions
///////////////////////////////////////////////////////////////////////////////
Torus.computeFaceNormal = function(x1,y1,z1, x2,y2,z2, x3,y3,z3)
{
    let normal = new Float32Array(3);
    let ex1 = x2 - x1;
    let ey1 = y2 - y1;
    let ez1 = z2 - z1;
    let ex2 = x3 - x1;
    let ey2 = y3 - y1;
    let ez2 = z3 - z1;
    // cross product: e1 x e2;
    let nx = ey1 * ez2 - ez1 * ey2;
    let ny = ez1 * ex2 - ex1 * ez2;
    let nz = ex1 * ey2 - ey1 * ex2;
    let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if(length > 0.000001)
    {
        normal[0] = nx / length;
        normal[1] = ny / length;
        normal[2] = nz / length;
    }
    return normal;
}
