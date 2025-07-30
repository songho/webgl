///////////////////////////////////////////////////////////////////////////////
// TorusKnot.js
// =============
// With default constructor, it creates a torus knot with majorRadius=1,
// minorRadius=0.5, tubeRadius=0.2, p=2, q=3, sectorCount=90, sideCount=18,
// smooth=true.
// The minimum # of p is 1 and q is 0
// The minimum # of sectors is 18 and sides is 2.
//
// Dependency: Vector3, Line, Plane
//
// Example of OpenGL drawing calls (interleaved mode)
// ===============================
//  gl.bindBuffer(gl.ARRAY_BUFFER, knot.vboVertex);
//  gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 32, 0);
//  gl.vertexAttribPointer(gl.program.attribute.vertexNormal, 3, gl.FLOAT, false, 32, 12);
//  gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord, 2, gl.FLOAT, false, 32, 24);
//  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, knot.vboIndex);
//  gl.drawElements(gl.TRIANGLES, knot.getIndexCount(), gl.UNSIGNED_SHORT, 0);
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2023-03-15
// UPDATED: 2025-07-29
///////////////////////////////////////////////////////////////////////////////

let TorusKnot = function(gl, majorRadius=1, minorRadius=0.5, tubeRadius=0.2, p=2, q=3, sectors=90, sides=18, smooth=true)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] TorusKnot.contructor requires GL context as a param.");

    this.majorRadius = 1;
    this.minorRadius = 0.5;
    this.tubeRadius = 0.2;
    this.p = 2;
    this.q = 3;
    this.sectorCount = 90;
    this.sideCount = 18;
    this.smooth = true;
    this.path = [];
    this.contour = [];
    this.contourNormal = [];
    this.firstContour = [];
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
    this.set(majorRadius, minorRadius, tubeRadius, p, q, sectors, sides, smooth);
};

TorusKnot.prototype =
{
    set: function(R, r, t, p, q, se, si, sm)
    {
        this.majorRadius = R;
        this.minorRadius = r;
        this.tubeRadius = t;
        this.p = p;
        if(p < 1) this.p = 1;
        this.q = q;
        if(q < 0) this.q = 0;
        this.sectorCount = se;
        if(se < 3)
            this.sectorCount = 18;
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
            this.set(r, this.minorRadius, this.tubeRadius, this.p, this.q, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setMinorRadius: function(r)
    {
        if(this.minorRadius != r)
            this.set(this.majorRadius, r, this.tubeRadius, this.p, this.q, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setTubeRadius: function(t)
    {
        if(this.tubeRadius != t)
            this.set(this.majorRadius, this.minorRadius, t, this.p, this.q, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setP: function(p)
    {
        if(this.p != p)
            this.set(this.majorRadius, this.minorRadius, this.tubeRadius, p, this.q, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setQ: function(q)
    {
        if(this.q != q)
            this.set(this.majorRadius, this.minorRadius, this.tubeRadius,this.p, q, this.sectorCount, this.sideCount, this.smooth);
        return this;
    },
    setSectorCount: function(s)
    {
        if(this.sectorCount != s)
            this.set(this.majorRadius, this.minorRadius, this.tubeRadius, this.p, this.q, s, this.sideCount, this.smooth);
        return this;
    },
    setSideCount: function(s)
    {
        if(this.sideCount != s)
            this.set(this.majorRadius, this.minorRadius, this.tubeRadius, this.p, this.q, this.sectorCount, s, this.smooth);
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
        return "===== TorusKnot =====\n" +
               "  Major Radius: " + this.majorRadius + "\n" +
               "  Minor Radius: " + this.minorRadius + "\n" +
               "   Tube Radius: " + this.tubeRadius + "\n" +
               "             P: " + this.p + "\n" +
               "             Q: " + this.q + "\n" +
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
        this.path.length = 0;
        this.contour.length = 0;
        this.contourNormal.length = 0;
        this.firstContour.length = 0;
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
    // generate path on the torus with (sectorCount+1) points
    // x = (R + r * cos(q*u)) * cos(p*u)
    // y = (R + r * cos(q*u)) * sin(p*u)
    // z = r * sin(q*u)
    // where u: 0 <= u <= 360
    ///////////////////////////////////////////////////////////////////////////
    buildPath: function()
    {
        const sectorStep = 2 * Math.PI / this.sectorCount;
        let sectorAngle, xy;

        this.path.length = 0;
        for(let i = 0; i < this.sectorCount; ++i)
        {
            sectorAngle = i * sectorStep;
            xy = this.majorRadius + this.minorRadius * Math.cos(this.q * sectorAngle);
            let v = new Vector3();
            v.x = xy * Math.cos(this.p * sectorAngle);
            v.y = xy * Math.sin(this.p * sectorAngle);
            v.z = this.minorRadius * Math.sin(this.q * sectorAngle);
            this.path.push(v);
        }

        // last point meets to the first point
        this.path.push(this.path[0].clone());
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate contour on XY-plane then transform to the first path point
    ///////////////////////////////////////////////////////////////////////////
    buildContour: function()
    {
        const sideStep = 2 * Math.PI / this.sideCount;
        let angle;
        this.contour.length = 0;
        this.contourNormal.length = 0;
        for(let i = 0; i <= this.sideCount; ++i)
        {
            angle = i * sideStep;
            let n = new Vector3(Math.cos(angle), Math.sin(angle), 0);
            this.contourNormal.push(n);
            let v = new Vector3(n.x*this.tubeRadius, n.y*this.tubeRadius, 0);
            this.contour.push(v);
        }

        // transform it to the first path point
        let dir1 = this.path[1].clone().subtract(this.path[0]);
        let dir2 = this.path[this.path.length-1].clone().subtract(this.path[this.path.length-2]);
        let t = this.path[0];
        let f = dir1.clone().add(dir2).normalize();
        let u = new Vector3(0,0,1);
        let l = Vector3.cross(u, f).normalize();
        u = Vector3.cross(f, l);
        for(let i = 0; i <= this.sideCount; ++i)
        {
            let c = this.contour[i];
            let v = new Vector3();
            v.x = l.x*c.x + u.x*c.y + f.x*c.z + t.x;
            v.y = l.y*c.x + u.y*c.y + f.y*c.z + t.y;
            v.z = l.z*c.x + u.z*c.y + f.z*c.z + t.z;
            this.contour[i] = v;
            let n = v.clone().subtract(t).normalize();
            this.contourNormal[i] = n;
        }

        // remember it
        this.firstContour.length = 0;
        for(let i = 0; i <= this.sideCount; ++i)
            this.firstContour.push(this.contour[i].clone());
    },

    ///////////////////////////////////////////////////////////////////////////
    // project contour from from-point to to-point of the path
    ///////////////////////////////////////////////////////////////////////////
    projectContour: function(fromIndex, toIndex)
    {
        // define a plane at to-point
        let p = this.path[toIndex];
        let dir1 = this.path[toIndex].clone().subtract(this.path[fromIndex]);
        let dir2;
        if(toIndex == this.sectorCount)
            dir2 = this.path[1].clone().subtract(this.path[0]);
        else
            dir2 = this.path[toIndex+1].clone().subtract(this.path[toIndex]);
        let n = dir1.clone().add(dir2);
        let d = -n.dot(p);
        let plane = new Plane(n.x, n.y, n.z, d);

        for(let i = 0; i <= this.sideCount; ++i)
        {
            // define line
            let line = new Line();
            line.setPoint(this.contour[i]);
            line.setDirection(dir1);
            // find intersect point
            let c = plane.intersect(line);
            this.contour[i] = c;
            this.contourNormal[i] = c.clone().subtract(p).normalize();
        }

        // align the last contour to the first contour
        if(toIndex == this.sectorCount)
            this.alignLastContour();
    },

    alignLastContour: function()
    {
        let c0 = this.contour[0];
        let minDist = this.tubeRadius * 2;
        let offset = 0;
        for(let i = 0; i < this.sideCount; ++i)
        {
            let c = this.firstContour[i];
            let dist = c0.distance(c);
            if(dist < minDist)
            {
                minDist = dist;
                offset = i;
            }
        }

        // snap vertices to the closest one
        for(let i = 0; i <= this.sideCount; ++i)
        {
            let index = (offset + i) % (this.sideCount);
            let c = this.firstContour[index];
            let p = this.path[0];
            this.contour[i] = c.clone();
            this.contourNormal[i] = c.clone().subtract(p).normalize();
        }
    },

    ///////////////////////////////////////////////////////////////////////////
    // generate vertices of torus with smooth shading
    ///////////////////////////////////////////////////////////////////////////
    buildVerticesSmooth: function()
    {
        let i, j, k1, k2, ii, jj, kk;

        // resize typed arrays
        this.resizeArraysSmooth();

        this.buildPath();
        this.buildContour();

        // add first contour
        ii = jj = kk = 0;
        for(i = 0; i <= this.sideCount; ++i)
        {
            let c = this.contour[i];
            let n = this.contourNormal[i];
            this.addVertex(ii, c.x, c.y, c.z);
            this.addNormal(ii, n.x, n.y, n.z);
            this.addTexCoord(jj, 0, i / this.sideCount);
            ii += 3;
            jj += 2;
        }
        // add rest of them
        for(i = 0; i < this.sectorCount; ++i)
        {
            let p = this.path[i+1];
            this.projectContour(i, i+1);
            for(let j = 0; j <= this.sideCount; ++j)
            {
                let c = this.contour[j];
                let n = c.clone().subtract(p).normalize();
                this.addVertex(ii, c.x, c.y, c.z);
                this.addNormal(ii, n.x, n.y, n.z);
                this.addTexCoord(jj, (i+1)/this.sectorCount, j/this.sideCount);
                ii += 3;
                jj += 2;
            }
        }

        // indices
        //  k1---k2
        //  |  / |
        //  | /  |
        //  k1+1-k2+1
        for(i=0; i < this.sectorCount; ++i)
        {
            k1 = i * (this.sideCount + 1);            // beginning of current sector
            k2 = k1 + this.sideCount + 1;             // beginning of next sector

            for(j=0; j < this.sideCount; ++j, ++k1, ++k2)
            {
                // 2 triangles per sector
                this.addIndices(kk, k1, k1+1, k2);  // k1---k1+1---k2
                kk += 3;

                this.addIndices(kk, k2, k1+1, k2+1);// k2---k1+1---k2+1
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
        let tmpVertices = [];
        let vertex = {};    // to store (x,y,z,s,t)

        // resize typed arrays
        this.resizeArraysFlat();

        this.buildPath();
        this.buildContour();

        // add first contour
        for(let i = 0; i <= this.sideCount; ++i)
        {
            let c = this.firstContour[i];
            vertex = {x: c.x,
                      y: c.y,
                      z: c.z,
                      s: 0,
                      t: i / this.sideCount};
            tmpVertices.push(vertex);
        }
        // add rest of them
        for(let i = 0; i < this.sectorCount; ++i)
        {
            this.projectContour(i, i+1);
            for(let j = 0; j <= this.sideCount; ++j)
            {
                let c = this.contour[j];
                vertex = {x: c.x,
                          y: c.y,
                          z: c.z,
                          s: (i+1) / this.sectorCount,
                          t: j / this.sideCount};
                tmpVertices.push(vertex);
            }
        }

        let i, j, n, v1, v2, v3, v4, vi1, vi2, index, ii, jj, kk;
        ii = jj = kk = index = 0;
        for(i = 0; i < this.sectorCount; ++i)
        {
            vi1 = i * (this.sideCount + 1);               // index of tmpVertices
            vi2 = (i+1) * (this.sideCount + 1);

            for(j = 0; j < this.sideCount; ++j, ++vi1, ++vi2)
            {
                // get 4 vertices per sector
                //  v1-v3
                //  |  |
                //  v2-v4
                v1 = tmpVertices[vi1];
                v2 = tmpVertices[vi1+1];
                v3 = tmpVertices[vi2];
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
                let e1 = new Vector3(v2.x-v1.x, v2.y-v1.y, v2.z-v1.z);
                let e2 = new Vector3(v3.x-v1.x, v3.y-v1.y, v3.z-v1.z);
                let n = Vector3.cross(e1, e2).normalize();
                this.addNormal(ii,   n.x, n.y, n.z);
                this.addNormal(ii+3, n.x, n.y, n.z);
                this.addNormal(ii+6, n.x, n.y, n.z);
                this.addNormal(ii+9, n.x, n.y, n.z);

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
