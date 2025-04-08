///////////////////////////////////////////////////////////////////////////////
// Cone.js
// =======
// With default constructor, it creates a cone with baseRadius=1,
// height=1, sectorCount=36, stackCount=1, smooth=true.
// The minimum # of sectors is 2 and stacks is 1.
//
// There are several options for the normals of the apex point when the smooth
// shading is enabled;
// 0: default (no changes), same as side normals
// 1: use uniform up-direction vectors
// 2: use uniform zero-length vectors
//
// Example of OpenGL drawing calls (interleaved mode)
// ===============================
//  gl.bindBuffer(gl.ARRAY_BUFFER, cone.vboVertex);
//  gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 32, 0);
//  gl.vertexAttribPointer(gl.program.attribute.vertexNormal, 3, gl.FLOAT, false, 32, 12);
//  gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord, 2, gl.FLOAT, false, 32, 24);
//  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cone.vboIndex);
//  gl.drawElements(gl.TRIANGLES, cone.getIndexCount(), gl.UNSIGNED_SHORT, 0);
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2023-03-16
// UPDATED: 2024-07-19
///////////////////////////////////////////////////////////////////////////////

let Cone = function(gl, r=1, h=1, sectors=36, stacks=1, smooth=true)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] Cone.contructor requires GL context as a param.");

    this.baseRadius = r;
    this.height = h;
    this.sectorCount = sectors;
    this.stackCount = stacks;
    this.smooth = smooth;
    this.apexNormalMode = 0;
    this.unitCircleVertices = [];
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

    this.buildUnitCircleVertices();
    if(this.smooth)
        this.buildVerticesSmooth();
    else
        this.buildVerticesFlat();
};

Cone.prototype =
{
    set: function(r, h, se, st, sm)
    {
        this.baseRadius = r;
        this.height = h;
        this.sectorCount = se;
        this.stackCount = st;
        this.smooth = sm;
        this.buildUnitCircleVertices();
        if(this.smooth)
            this.buildVerticesSmooth();
        else
            this.buildVerticesFlat();
        return this;
    },
    setBaseRadius: function(r)
    {
        if(this.baseRadius != r)
            this.set(r, this.height, this.sectorCount, this.stackCount, this.smooth);
        return this;
    },
    setHeight: function(h)
    {
        if(this.height != h)
            this.set(this.baseRadius, h, this.sectorCount, this.stackCount, this.smooth);
        return this;
    },
    setSectorCount: function(s)
    {
        if(this.sectorCount != s)
            this.set(this.baseRadius, this.height, s, this.stackCount, this.smooth);
        return this;
    },
    setStackCount: function(s)
    {
        if(this.stackCount != s)
            this.set(this.baseRadius, this.height, this.sectorCount, s, this.smooth);
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
    setApexNormalMode: function(mode)
    {
        if(this.apexNormalMode != mode && mode < 3)
        {
            this.apexNormalMode = mode;
            if(this.smooth)
                this.buildVerticesSmooth();
        }
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
        return "===== Cone =====\n" +
               "   Base Radius: " + this.baseRadius + "\n" +
               "        Height: " + this.height + "\n" +
               "  Sector Count: " + this.sectorCount + "\n" +
               "   Stack Count: " + this.stackCount + "\n" +
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
        let sideCount = (this.sectorCount + 1) * (this.stackCount + 1);
        let baseCount = this.sectorCount + 1;
        this.vertices = new Float32Array(3 * (sideCount + baseCount));
        this.normals = new Float32Array(3 * (sideCount + baseCount));
        this.texCoords = new Float32Array(2 * (sideCount + baseCount));
        this.indices = new Uint16Array(6 * this.sectorCount * this.stackCount);
    },
    resizeArraysFlat: function()
    {
        this.clearArrays();
        let sideCount = this.sectorCount * 4 * this.stackCount;
        let baseCount = this.sectorCount + 1;
        this.vertices = new Float32Array(3 * (sideCount + baseCount));
        this.normals = new Float32Array(3 * (sideCount + baseCount));
        this.texCoords = new Float32Array(2 * (sideCount + baseCount));
        this.indices = new Uint16Array(6 * this.sectorCount * this.stackCount);
        //this.indices = new Uint16Array(6 * this.sectorCount * this.stackCount - 3 * this.sectorCount + 3 * this.sectorCount);
    },

    ///////////////////////////////////////////////////////////////////////////
    // create vertices for unit circles
    ///////////////////////////////////////////////////////////////////////////
    buildUnitCircleVertices: function()
    {
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let sectorAngle = 0;
        this.unitCircleVertices.length = 0; // clear prev array
        this.unitCircleVertices = new Float32Array((this.sectorCount + 1) * 3);
        for(let i = 0, j = 0; i <= this.sectorCount; ++i, j += 3)
        {
            sectorAngle = i * sectorStep;
            this.unitCircleVertices[j] = Math.cos(sectorAngle);
            this.unitCircleVertices[j+1] = Math.sin(sectorAngle);
            this.unitCircleVertices[j+2] = 0;
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of cone with smooth shading
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesSmooth: function()
    {
        // resize typed arrays
        this.resizeArraysSmooth();

        let x, y, z, r, s, t, i, j, k, k1, k2;
        let ii = 0;
        let jj = 0;
        let kk = 0;
        let sideNormals = this.getSideNormals();
        let apexNormals = this.getApexNormals();

        // put vertices of sides to array by scaling unit circle
        for(i=0; i <= this.stackCount; ++i)
        {
            z = -(this.height * 0.5) + i / this.stackCount * this.height;
            r = this.baseRadius * (1 - i / this.stackCount); // interpolate radius
            t = 1.0 - i / this.stackCount;   // top-to-bottom

            for(j=0, k=0; j <= this.sectorCount; ++j, k+=3)
            {
                if(i < this.stackCount)
                {
                    x = this.unitCircleVertices[k];
                    y = this.unitCircleVertices[k+1];
                    this.addVertex(ii, x*r, y*r, z);
                    this.addNormal(ii, sideNormals[k], sideNormals[k+1], sideNormals[k+2]);
                }
                // for the apex (last stack)
                else
                {
                    this.addVertex(ii, 0, 0, z);
                    this.addNormal(ii, apexNormals[k], apexNormals[k+1], apexNormals[k+2]);
                }
                s = j / this.sectorCount;
                this.addTexCoord(jj, s, t);
                // next
                ii += 3;
                jj += 2;
            }
        }

        // remember where the base surface vertices start
        let baseVertexIndex = ii / 3;

        // put vertices of base of cone
        z = -this.height * 0.5;
        this.addVertex(ii, 0, 0, z);
        this.addNormal(ii, 0, 0, -1);
        this.addTexCoord(jj, 0.5, 0.5);
        ii += 3;
        jj += 2;
        for(i=0, j=0; i < this.sectorCount; ++i, j+=3)
        {
            x = this.unitCircleVertices[j];
            y = this.unitCircleVertices[j+1];
            this.addVertex(ii, x*this.baseRadius, y*this.baseRadius, z);
            this.addNormal(ii, 0, 0, -1);
            this.addTexCoord(jj, -x*0.5+0.5, -y*0.5+0.5);   // flip horizontal
            ii += 3;
            jj += 2;
        }

        // put indices for sides
        for(i=0; i < this.stackCount; ++i)
        {
            k1 = i * (this.sectorCount + 1);     // beginning of current stack
            k2 = k1 + this.sectorCount + 1;      // beginning of next stack

            for(j=0; j < this.sectorCount; ++j, ++k1, ++k2)
            {
                // 2 trianles per sector except apex
                if(i < this.stackCount - 1)
                {
                    this.addIndices(kk, k1, k1 + 1, k2);
                    this.addIndices(kk+3, k2, k1 + 1, k2 + 1);
                    kk += 6;
                }
                // 1 triangle for apex
                else
                {
                    this.addIndices(kk, k1, k1 + 1, k2);
                    kk += 3;
                }
            }
        }

        // put indices for base
        for(i=0, k=baseVertexIndex+1; i < this.sectorCount; ++i, ++k)
        {
            if(i < (this.sectorCount - 1))
                this.addIndices(kk, baseVertexIndex, k + 1, k);
            else    // last triangle
                this.addIndices(kk, baseVertexIndex, baseVertexIndex + 1, k);
            kk += 3;
        }

        // generate interleaved vertex array as well
        this.buildInterleavedVertices();
        this.buildVbos();
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of cone with flat shading
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesFlat: function()
    {
        let i, j, k, x, y, z, r, t;
        let tmpVertices = [];
        let vertex = {};    // to store (x,y,z,s,t)
        for(i=0, m=0; i <= this.stackCount; ++i)
        {
            z = -(this.height * 0.5) + i / this.stackCount * this.height;
            //r = this.baseRadius + i / this.stackCount * (this.topRadius - this.baseRadius);
            r = this.baseRadius * (1 - i / this.stackCount); // interpolate radius
            t = 1.0 - i / this.stackCount;
            for(j=0, k=0, l=0; j <= this.sectorCount; ++j, k+=3, l+=2)
            {
                x = this.unitCircleVertices[k];
                y = this.unitCircleVertices[k+1];
                vertex = {x:x*r, y:y*r, z:z, s:j/this.sectorCount, t:t};
                tmpVertices.push(vertex);
            }
        }

        // resize typed arrays
        this.resizeArraysFlat();

        let v1, v2, v3, v4, n, index, ii, jj, kk;
        ii = jj = kk = index = 0;
        // v2-v4 <= stack at i+1
        // | \ |
        // v1-v3 <= stack at i
        for(i=0; i < this.stackCount; ++i)
        {
            vi1 = i * (this.sectorCount + 1);
            vi2 = (i+1) * (this.sectorCount+1);

            for(j=0; j < this.sectorCount; ++j, ++vi1, ++vi2)
            {
                v1 = tmpVertices[vi1];
                v2 = tmpVertices[vi2];
                v3 = tmpVertices[vi1+1];
                v4 = tmpVertices[vi2+1];

                // add vertices/normals/texCoords of a quad: v1-v2-v3-v4
                this.addVertex(ii,   v1.x, v1.y, v1.z);
                this.addVertex(ii+3, v2.x, v2.y, v2.z);
                this.addVertex(ii+6, v3.x, v3.y, v3.z);
                this.addVertex(ii+9, v4.x, v4.y, v4.z);
                this.addTexCoord(jj,   v1.s, v1.t);
                this.addTexCoord(jj+2, v2.s, v2.t);
                this.addTexCoord(jj+4, v3.s, v3.t);
                this.addTexCoord(jj+6, v4.s, v4.t);

                // normal for v1-v3-v2
                n = Cone.computeFaceNormal(v1.x,v1.y,v1.z, v3.x,v3.y,v3.z, v2.x,v2.y,v2.z);
                for(k=0; k < 4; ++k)  // same normals for all 4 vertices
                {
                    this.addNormal(ii+(k*3), n[0], n[1], n[2]);
                }

                // next
                ii += 12;
                jj += 8;

                // add indices of quad except apex
                if(i < this.stackCount - 1)
                {
                    this.addIndices(kk,   index, index+2, index+1);     // v1-v3-v2
                    this.addIndices(kk+3, index+1, index+2, index+3);   // v2-v3-v4
                    kk += 6;
                    index += 4; // for next
                }
                // 1 tri for apex
                else
                {
                    this.addIndices(kk,   index, index+2, index+1);     // v1-v3-v2
                    kk += 3;
                    index += 4; // for next
                }
            }
        }

        // remember where the base index starts
        let baseVertexIndex = ii / 3;

        // put vertices of base of cone
        z = -this.height * 0.5;
        this.addVertex(ii, 0, 0, z);
        this.addNormal(ii, 0, 0, -1);
        this.addTexCoord(jj, 0.5, 0.5);
        ii += 3;
        jj += 2;
        for(i=0, j=0; i < this.sectorCount; ++i, j+=3)
        {
            x = this.unitCircleVertices[j];
            y = this.unitCircleVertices[j+1];
            this.addVertex(ii, x*this.baseRadius, y*this.baseRadius, z);
            this.addNormal(ii, 0, 0, -1);
            this.addTexCoord(jj, -x*0.5+0.5, -y*0.5+0.5);   // flip horizontal
            ii += 3;
            jj += 2;
        }

        // put indices for base
        for(i=0, k=baseVertexIndex+1; i < this.sectorCount; ++i, ++k)
        {
            if(i < this.sectorCount - 1)
                this.addIndices(kk, baseVertexIndex, k+1, k);
            else
                this.addIndices(kk, baseVertexIndex, baseVertexIndex+1, k);

            kk += 3;
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
    // generate shared normal vectors of the side of cone
    ///////////////////////////////////////////////////////////////////////////
    getSideNormals: function()
    {
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let sectorAngle = 0;

        let zAngle = Math.atan2(this.baseRadius, this.height);
        let x0 = Math.cos(zAngle);
        let z0 = Math.sin(zAngle);

        let normals = new Float32Array(3 * (this.sectorCount + 1));
        for(let i = 0, j = 0; i <= this.sectorCount; ++i, j+=3)
        {
            sectorAngle = i * sectorStep;
            normals[j]   = Math.cos(sectorAngle)*x0;
            normals[j+1] = Math.sin(sectorAngle)*x0;
            normals[j+2] = z0;
        }
        return normals;
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate shared normal vectors of the apex of cone
    ///////////////////////////////////////////////////////////////////////////
    getApexNormals: function()
    {
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let sectorAngle = 0;

        let zAngle = Math.atan2(this.baseRadius, this.height);
        let x0 = Math.cos(zAngle);
        let z0 = Math.sin(zAngle);

        let normals = new Float32Array(3 * (this.sectorCount + 1));
        for(let i = 0, j = 0; i <= this.sectorCount; ++i, j+=3)
        {
            if(this.apexNormalMode == 0)
            {
                // default, same as side normals
                sectorAngle = i * sectorStep;
                normals[j]   = Math.cos(sectorAngle)*x0;
                normals[j+1] = Math.sin(sectorAngle)*x0;
                normals[j+2] = z0;
            }
            else if(this.apexNormalMode == 1)
            {
                // up vector
                normals[j]   = 0;
                normals[j+1] = 0;
                normals[j+2] = 1;
            }
            else if(this.apexNormalMode == 2)
            {
                // zero vector
                normals[j]   = 0;
                normals[j+1] = 0;
                normals[j+2] = 0;
            }
        }
        return normals;
    },

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
// class (static) function: generate face normal of a triangle
///////////////////////////////////////////////////////////////////////////////
Cone.computeFaceNormal = function(x1,y1,z1, x2,y2,z2, x3,y3,z3)
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
