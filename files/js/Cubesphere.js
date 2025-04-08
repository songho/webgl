///////////////////////////////////////////////////////////////////////////////
// Cubesphere.js
// =============
// cube-based sphere dividing the spherical surface into 6 equal-area faces of
// a cube (+X, -X, +Y, -Y, +Z, -Z)
// With the default constructor, it creates a cubesphere with radius=1,
// subdivision=3 and smooth=true.
// If subdivision=1, it is identical to a cube, which is inscribed in a sphere.
// The max subdivision is 52 due to the limitation of Uint16 (65536).
//
// Example of OpenGL drawing calls (interleaved mode)
// ===============================
//  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vboVertex);
//  gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 32, 0);
//  gl.vertexAttribPointer(gl.program.attribute.vertexNormal, 3, gl.FLOAT, false, 32, 12);
//  gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord, 2, gl.FLOAT, false, 32, 24);
//  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vboIndex);
//  gl.drawElements(gl.TRIANGLES, sphere.getIndexCount(), gl.UNSIGNED_SHORT, 0);
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2020-12-24
// UPDATED: 2024-09-06
///////////////////////////////////////////////////////////////////////////////

let Cubesphere = function(gl, radius=1, subdivision=3, smooth=true)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] Cubesphere.contructor requires GL context as a param.");

    this.radius = 1;
    this.subdivision = 3;
    this.smooth = true;
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.indices = [];
    this.interleavedVertices = [];
    this.stride = 32;   // stride for interleaved vertices, always=32
    this.vertexCountPerRow = 0;
    if(gl)
    {
        this.vboVertex = gl.createBuffer();
        this.vboIndex = gl.createBuffer();
    }
    // init
    this.set(radius, subdivision, smooth);
};

Cubesphere.prototype =
{
    set: function(r, sub, sm)
    {
        this.radius = r;
        this.subdivision = sub;
        if(sub < 1)
            this.subdivision = 1;   // min segments
        else if(sub > 52)
            this.subdivision = 52;  // max segments
        this.smooth = sm;

        this.vertexCountPerRow = this.subdivision + 1;

        if(sm)
            this.buildVerticesSmooth();
        else
            this.buildVerticesFlat();
        return this;
    },
    setRadius: function(r)
    {
        if(this.radius != r)
            this.set(r, this.subdivision, this.smooth);
        return this;
    },
    setSideLength: function(s)
    {
        let radius = s * Math.sqrt(3) / 2;  // convert side length to radius
        this.setRadius(radius);
        return this;
    },
    setSubdivision: function(sub)
    {
        if(this.subdivision != sub)
        {
            this.set(this.radius, sub, this.smooth);
        }
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
    /*@@ NOT USED
    updateRadius: function()
    {
        let scale = Cubesphere.computeScaleForLength(this.vertices[0],
                                                     this.vertices[1],
                                                     this.vertices[2],
                                                     this.radius);
        let i, j;
        let count = this.vertices.length;
        for(i = 0, j = 0; i < count; i += 3, j += 8)
        {
            this.vertices[i]   *= scale;
            this.vertices[i+1] *= scale;
            this.vertices[i+2] *= scale;

            // for interleaved array
            this.interleavedVertices[j]   *= scale;
            this.interleavedVertices[j+1] *= scale;
            this.interleavedVertices[j+2] *= scale;
        }
        this.buildVbos();
    },
    */
    getSideLength: function()
    {
        return this.radius * 2 / Math.sqrt(3);
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
        return "===== Cubesphere =====\n" +
               "        Radius: " + this.radius + "\n" +
               "   Side Length: " + this.getSideLength().toFixed(5) + "\n" +
               "   Subdivision: " + this.subdivision + "\n" +
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
        let count = 6 * this.vertexCountPerRow * this.vertexCountPerRow;
        this.vertices = new Float32Array(3 * count);
        this.normals = new Float32Array(3 * count);
        this.texCoords = new Float32Array(2 * count);
        this.indices = new Uint16Array(6 * 6 * this.subdivision * this.subdivision);
    },
    resizeArraysFlat: function()
    {
        this.clearArrays();
        let count = 6 * 4 * this.subdivision * this.subdivision;
        this.vertices = new Float32Array(3 * count);
        this.normals = new Float32Array(3 * count);
        this.texCoords = new Float32Array(2 * count);
        this.indices = new Uint16Array(6 * 6 * this.subdivision * this.subdivision);
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of sphere with smooth shading
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesSmooth: function()
    {
        // generate unit-length vertices in +X face
        let unitVertices = Cubesphere.getUnitPositiveX(this.vertexCountPerRow);

        // resize typed arrays
        this.resizeArraysSmooth();

        let x, y, z, s, t;
        let i, j, k, k1, k2, ii, jj, kk;

        // build +X faces
        ii = jj = kk = k = 0;
        for(i = 0; i < this.vertexCountPerRow; ++i)
        {
            k1 = i * this.vertexCountPerRow;    // index for curr row
            k2 = k1 + this.vertexCountPerRow;   // index for next row
            t = i / (this.vertexCountPerRow - 1);

            for(j = 0; j < this.vertexCountPerRow; ++j, ++k1, ++k2)
            {
                x = unitVertices[k];
                y = unitVertices[k+1];
                z = unitVertices[k+2];
                s = j / (this.vertexCountPerRow - 1);
                this.addVertex(ii, x*this.radius, y*this.radius, z*this.radius);
                this.addNormal(ii, x, y, z);
                this.addTexCoord(jj, s, t);

                // add indices
                if(i < (this.vertexCountPerRow-1) && j < (this.vertexCountPerRow-1))
                {
                    this.addIndices(kk, k1, k2, k1+1);
                    kk += 3;
                    this.addIndices(kk, k1+1, k2, k2+1);
                    kk += 3;
                }

                // next
                ii += 3;
                jj += 2;
                k += 3;
            }
        }

        // array size and index for building next face
        let vertexSize = 3 * this.vertexCountPerRow * this.vertexCountPerRow;   // per face
        let indexSize = 6 * this.subdivision * this.subdivision;                // per face
        let startIndex;

        // build -X face by negating x and z
        for(i = 0, j = 0; i < vertexSize; i += 3, j +=2)
        {
            this.addVertex(ii, -this.vertices[i], this.vertices[i+1], -this.vertices[i+2]);
            this.addNormal(ii, -this.normals[i], this.normals[i+1], -this.normals[i+2]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build +Y face by swapping x=>y, y=>-z, z=>-x
        for(i = 0, j = 0; i < vertexSize; i += 3, j +=2)
        {
            this.addVertex(ii, -this.vertices[i+2], this.vertices[i], -this.vertices[i+1]);
            this.addNormal(ii, -this.normals[i+2], this.normals[i], -this.normals[i+1]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 2 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build -Y face by swapping x=>-y, y=>z, z=>-x
        for(i = 0, j = 0; i < vertexSize; i += 3, j +=2)
        {
            this.addVertex(ii, -this.vertices[i+2], -this.vertices[i], this.vertices[i+1]);
            this.addNormal(ii, -this.normals[i+2], -this.normals[i], this.normals[i+1]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 3 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build +Z face by swapping x=>z, z=>-x
        for(i = 0, j = 0; i < vertexSize; i += 3, j +=2)
        {
            this.addVertex(ii, -this.vertices[i+2], this.vertices[i+1], this.vertices[i]);
            this.addNormal(ii, -this.normals[i+2], this.normals[i+1], this.normals[i]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 4 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build -Z face by swapping x=>-z, z=>x
        for(i = 0, j = 0; i < vertexSize; i += 3, j +=2)
        {
            this.addVertex(ii, this.vertices[i+2], this.vertices[i+1], -this.vertices[i]);
            this.addNormal(ii, this.normals[i+2], this.normals[i+1], -this.normals[i]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 5 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // generate interleaved vertex array as well
        this.buildInterleavedVertices();
        this.buildVbos();
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of cubesphere with flat shading
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesFlat: function()
    {
        // generate unit-length vertices in +X face
        let unitVertices = Cubesphere.getUnitPositiveX(this.vertexCountPerRow);

        // resize typed arrays
        this.resizeArraysFlat();

        let i, j, k, k1, k2, i1, i2, ii, jj, kk;    // indices
        let v1=[], v2=[], v3=[], v4=[];             // tmp vertices
        let t1=[], t2=[], t3=[], t4=[];             // texture coords
        let n=[];                                   // normal vector

        // +X face
        ii = jj = kk = k = 0;
        for(i = 0; i < this.vertexCountPerRow - 1; ++i)
        {
            k1 = i * this.vertexCountPerRow;        // index at curr row
            k2 = k1 + this.vertexCountPerRow;       // index at next row

            // vertical tex coords
            t1[1] = t3[1] = i / (this.vertexCountPerRow - 1);
            t2[1] = t4[1] = (i+1) / (this.vertexCountPerRow - 1);

            for(j = 0; j < this.vertexCountPerRow - 1; ++j, ++k1, ++k2)
            {
                i1 = k1 * 3;
                i2 = k2 * 3;

                // 4 vertices of a quad
                // v1--v3
                // | / |
                // v2--v4
                v1[0] = unitVertices[i1];
                v1[1] = unitVertices[i1+1];
                v1[2] = unitVertices[i1+2];
                v2[0] = unitVertices[i2];
                v2[1] = unitVertices[i2+1];
                v2[2] = unitVertices[i2+2];
                v3[0] = unitVertices[i1+3];
                v3[1] = unitVertices[i1+4];
                v3[2] = unitVertices[i1+5];
                v4[0] = unitVertices[i2+3];
                v4[1] = unitVertices[i2+4];
                v4[2] = unitVertices[i2+5];

                // compute face nornal
                n = Cubesphere.computeFaceNormal(v1, v2, v3);

                // resize vertices by sphere radius
                Cubesphere.scaleVertex(v1, this.radius);
                Cubesphere.scaleVertex(v2, this.radius);
                Cubesphere.scaleVertex(v3, this.radius);
                Cubesphere.scaleVertex(v4, this.radius);

                // compute horizontal tex coords
                t1[0] = t2[0] = j / (this.vertexCountPerRow - 1);
                t3[0] = t4[0] = (j+1) / (this.vertexCountPerRow - 1);

                // add 4 vertex attributes
                this.addVertex(ii, v1[0], v1[1], v1[2]);
                this.addNormal(ii, n[0], n[1], n[2]);
                ii += 3;
                this.addVertex(ii, v2[0], v2[1], v2[2]);
                this.addNormal(ii, n[0], n[1], n[2]);
                ii += 3;
                this.addVertex(ii, v3[0], v3[1], v3[2]);
                this.addNormal(ii, n[0], n[1], n[2]);
                ii += 3;
                this.addVertex(ii, v4[0], v4[1], v4[2]);
                this.addNormal(ii, n[0], n[1], n[2]);
                ii += 3;
                this.addTexCoord(jj, t1[0], t1[1]);
                jj += 2;
                this.addTexCoord(jj, t2[0], t2[1]);
                jj += 2;
                this.addTexCoord(jj, t3[0], t3[1]);
                jj += 2;
                this.addTexCoord(jj, t4[0], t4[1]);
                jj += 2;

                // add indices of 2 triangles
                this.addIndices(kk, k, k+1, k+2);
                kk += 3;
                this.addIndices(kk, k+2, k+1, k+3);
                kk += 3;

                k += 4;     // next
            }
        }

        // array size and index for building next face
        let vertexSize = 3 * 4 * this.subdivision * this.subdivision; // per face
        let indexSize = 6 * this.subdivision * this.subdivision;                // per face
        let startIndex;                                         // starting index for next face

        // build -X face by negating x and z values
        for(i = 0, j = 0; i < vertexSize; i += 3, j += 2)
        {
            this.addVertex(ii, -this.vertices[i], this.vertices[i+1], -this.vertices[i+2]);
            this.addNormal(ii, -this.normals[i], this.normals[i+1], -this.normals[i+2]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build +Y face by swapping x=>y, y=>-z, z=>-x
        for(i = 0, j = 0; i < vertexSize; i += 3, j += 2)
        {
            this.addVertex(ii, -this.vertices[i+2], this.vertices[i], -this.vertices[i+1]);
            this.addNormal(ii, -this.normals[i+2], this.normals[i], -this.normals[i+1]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 2 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build -Y face by swapping x=>-y, y=>z, z=>-x
        for(i = 0, j = 0; i < vertexSize; i += 3, j += 2)
        {
            this.addVertex(ii, -this.vertices[i+2], -this.vertices[i], this.vertices[i+1]);
            this.addNormal(ii, -this.normals[i+2], -this.normals[i], this.normals[i+1]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 3 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build +Z face by swapping x=>z, z=>-x
        for(i = 0, j = 0; i < vertexSize; i += 3, j += 2)
        {
            this.addVertex(ii, -this.vertices[i+2], this.vertices[i+1], this.vertices[i]);
            this.addNormal(ii, -this.normals[i+2], this.normals[i+1], this.normals[i]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 4 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
        }

        // build -Z face by swapping x=>-z, z=>x
        for(i = 0, j = 0; i < vertexSize; i += 3, j += 2)
        {
            this.addVertex(ii, this.vertices[i+2], this.vertices[i+1], -this.vertices[i]);
            this.addNormal(ii, this.normals[i+2], this.normals[i+1], -this.normals[i]);
            this.addTexCoord(jj, this.texCoords[j], this.texCoords[j+1]);
            ii += 3;
            jj += 2;
        }
        startIndex = vertexSize * 5 / 3;
        for(i = 0; i < indexSize; ++i)
        {
            this.indices[kk] = startIndex + this.indices[i];
            ++kk;
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

///////////////////////////////////////////////////////////////////////////////
// get the scale factor for vector to resize to the given length of vector
///////////////////////////////////////////////////////////////////////////////
Cubesphere.computeScaleForLength = function(vx, vy, vz, length)
{
    // and normalize the vector then re-scale to new radius
    return length / Math.sqrt(vx * vx + vy * vy + vz * vz);
}



///////////////////////////////////////////////////////////////////////////////
// generate vertices for +X face only by intersecting 2 circular planes
// (longitudinal and latitudinal) at the longitude/latitude angles
///////////////////////////////////////////////////////////////////////////////
Cubesphere.getUnitPositiveX = function(pointsPerRow)
{
    const D2R = Math.acos(-1) / 180;

    let vertices = new Float32Array(3 * pointsPerRow * pointsPerRow);
    let n1 = new Float32Array(3);   // normal of longitudinal plane rotating along Y-axis
    let n2 = new Float32Array(3);   // normal of latitudinal plane rotating along Z-axis
    let v = new Float32Array(3);    // direction vector intersecting 2 planes, n1 x n2
    let a1;                         // longitudinal angle along y-axis (-45 ~ +45)
    let a2;                         // latitudinal angle along z-axis (+45 ~ -45)
    let scale;
    let i, j, k;

    // rotate latitudinal plane from 45 to -45 degrees along Z-axis
    k = 0;
    for(i = 0; i < pointsPerRow; ++i)
    {
        // normal for latitudinal plane
        a2 = D2R * (45 - 90 * i / (pointsPerRow - 1));
        n2[0] = -Math.sin(a2);
        n2[1] = Math.cos(a2);
        n2[2] = 0;

        // rotate longitudinal plane from -45 to 45 along Y-axis
        for(j = 0; j < pointsPerRow; ++j)
        {
            // normal for longitudinal plane
            a1 = D2R * (-45 + 90 * j / (pointsPerRow - 1));
            n1[0] = -Math.sin(a1);
            n1[1] = 0;
            n1[2] = -Math.cos(a1);

            // find direction vector of intersected line, n1 x n2
            v[0] = n1[1] * n2[2] - n1[2] * n2[1];
            v[1] = n1[2] * n2[0] - n1[0] * n2[2];
            v[2] = n1[0] * n2[1] - n1[1] * n2[0];

            // normalize direction vector
            scale = Cubesphere.computeScaleForLength(v[0], v[1], v[2], 1);
            Cubesphere.scaleVertex(v, scale);

            vertices[k]   = v[0];
            vertices[k+1] = v[1];
            vertices[k+2] = v[2];
            k += 3; // next index
        }
    }

    return vertices;
}



///////////////////////////////////////////////////////////////////////////////
// return the normal of a triangle
// inputs are arrays of 3 elements (x,y,z)
///////////////////////////////////////////////////////////////////////////////
Cubesphere.computeFaceNormal = function(v1, v2, v3)
{
    let normal = new Float32Array(3);
    let ex1 = v2[0] - v1[0];    // e1 = v2 - v1
    let ey1 = v2[1] - v1[1];
    let ez1 = v2[2] - v1[2];
    let ex2 = v3[0] - v1[0];    // e2 = v3 - v1
    let ey2 = v3[1] - v1[1];
    let ez2 = v3[2] - v1[2];
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



///////////////////////////////////////////////////////////////////////////////
// rescale vertex length
///////////////////////////////////////////////////////////////////////////////
Cubesphere.scaleVertex = function(v, scale)
{
    v[0] *= scale;
    v[1] *= scale;
    v[2] *= scale;
}
