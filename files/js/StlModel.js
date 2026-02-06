///////////////////////////////////////////////////////////////////////////////
// StlModel.js
// ===========
// STL (STereo Lithography) 3D model loader
// dependencies: Vectors.js
//
// STL can be defined either ASCII or Binary format.
// 1) ASCII Format
//  - ASCII file must begin with "solid"
//  - Each facet begins with "facet" and follows normal
//      facet normal ...
//          outer loop
//              vertex ...
//              vertex ...
//              vertex ...
//          endloop
//      endfacet
//
// 2) Binary Format
//  - Binary file begins with 80-byte header
//  - 4-byte (int) for the # of facets
//  - 50-byte for each facet = 12-byte normal + 36-byte vertices + 2-byte padding
//
//  AUTHOR: Song Ho Ahn (ssong.ahn@gmail.com)
// CREATED: 2025-09-19
// UPDATED: 2026-02-05
//
// Copyright (c) 2025. Song Ho Ahn
///////////////////////////////////////////////////////////////////////////////


let StlModel = function()
{
    this.vertexCount = 0;
    this.normalCount = 0;
    this.indexCount = 0;
    this.triangleCount = 0;
    this.vertices = null;
    this.normals = null;
    this.indices = null;
    this.center = new Vector3();
    this.radius = 0;
    this.indexType = 0x1403; // UNSIGNED_SHORT or UNSIGNED_INT (0x1405)
    this.fileType = "ASCII";
    // dimension
    this.minX = 0;
    this.minY = 0;
    this.minZ = 0;
    this.maxX = 0;
    this.maxY = 0;
    this.maxZ = 0;
};

StlModel.prototype =
{
    ///////////////////////////////////////////////////////////////////////////
    // return promise object
    read: function(file)
    {
        return new Promise((resolve, reject) =>
        {
            if(!file) reject("[ERROR] NULL STL filename");

            let self = this;

            // check object type
            if(file instanceof String || typeof file == "string")
            {
                // for remote file
                let xhr = new XMLHttpRequest();
                xhr.responseType = "blob";
                xhr.open("GET", file, true);
                xhr.send();
                // add event
                xhr.onload = function(e)
                {
                    if(xhr.status == 200) // OK
                    {
                        xhr.response.arrayBuffer().then(buffer =>
                        {
                            parseMesh(self, buffer); // pass arraybuffer
                            resolve(self);
                        });
                    }
                    else
                    {
                        reject("[ERROR] Failed to load STL file: " + file + " (status:" + xhr.status + ")");
                    }
                };
                xhr.onerror = function(e)
                {
                    reject("[ERROR] Failed to load STL file: " + file);
                };
            }
            else if(file instanceof window.File)
            {
                // for local file using File API
                let reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function(e)
                {
                    parseMesh(self, e.target.result); // pass arraybuffer
                    resolve(self);
                };
                reader.onerror = function(e)
                {
                    reject("[ERROR] Failed to load STL file" + file.name);
                };
            }
        });

        // inner functions for read() =====================
        function parseMesh(self, buffer)
        {
            if(!(buffer instanceof ArrayBuffer))
            {
                console.log("Unknown buffer type to parse.");
                return;
            }

            let magic = new Uint8Array(buffer).slice(0, 5);
            if(magic[0]==115 && magic[1]==111 && magic[2]==108 && magic[3]==105 && magic[4]==100)
                parseMeshAscii(self, buffer);
            else
                parseMeshBinary(self, buffer);
        }
        function parseMeshAscii(self, buffer)
        {
            // clean up previous
            self.vertices = self.normals = self.indices = null;

            // arrays for vertex, normal
            let vertices = [];
            let normals = [];
            let indices = [];
            let line, tokens, nx, ny, nz;
            let faceIndex = 0;

            // convert to lines
            let decoder = new TextDecoder();
            let lines = decoder.decode(buffer).split(/\r\n|\r|\n/);

            // split to lines
            let lineCount = lines.length;
            for(let i = 0; i < lineCount; ++i)
            {
                line = lines[i].trim();

                //console.log(line);
                if(line.includes("facet"))
                {
                    tokens = line.split(" ");
                    if(tokens.length > 4)
                    {
                        nx = parseFloat(tokens[2]);
                        ny = parseFloat(tokens[3]);
                        nz = parseFloat(tokens[4]);
                    }
                    else
                    {
                        nx = 0;
                        ny = 0;
                        nz = 1;
                    }
                
                    // facet loop: add vertices
                    while(++i < lineCount)
                    {
                        line = lines[i].trim();
                        if(line.includes("vertex"))
                        {
                            tokens = line.split(" ");
                            if(tokens.length > 3)
                            {
                                vertices.push(parseFloat(tokens[1]));
                                vertices.push(parseFloat(tokens[2]));
                                vertices.push(parseFloat(tokens[3]));
                                normals.push(nx);
                                normals.push(ny);
                                normals.push(nz);
                                indices.push(faceIndex++);
                            }
                        }
                        else if(line.includes("endfacet"))
                        {
                            break; // exit facet loop
                        }
                    }
                }
            }

            // create new typed arrays
            self.vertices = new Float32Array(vertices);
            self.normals = new Float32Array(normals);
            if((vertices.length / 3) <= 65536)
            {
                self.indices = new Uint16Array(indices);
                self.indexType = 0x1403;
            }
            else
            {
                self.indices = new Uint32Array(indices);
                self.indexType = 0x1405;
            }

            // compute counters
            self.vertexCount = self.vertices.length / 3 || 0;
            self.normalCount = self.normals.length / 3 || 0;
            self.indexCount = self.indices.length || 0;
            self.triangleCount = self.indexCount / 3 || 0;
            self.fileType = "ASCII";

            // compute bounding box
            computeBoundingBox(self);
        } // end of parseMeshAscii()
        function parseMeshBinary(self, buffer)
        {
            // clean up previous
            self.vertices = self.normals = self.indices = null;

            // arrays for vertex, normal
            let vertices = [];
            let normals = [];
            let indices = [];
            let i, j, n, v;
            let offset = 0;
            let faceIndex = 0;

            let faceCount = new Int32Array(buffer, 80, 1); // skip 80 bytes
            //console.log("faceCount: " + faceCount);

            for(i = 0, j = 0, offset = 84; i < faceCount; ++i, j+=3, offset+=50)
            {
                // float needs 4-byte alignment
                let alignedBuffer = buffer.slice(offset, offset+48); // 12+36
                n = new Float32Array(alignedBuffer, 0, 3);
                v = new Float32Array(alignedBuffer, 12, 9);
                normals.push(...n);
                normals.push(...n);
                normals.push(...n);
                vertices.push(...v);
                indices.push(...[j, j+1, j+2]);
            }
            
            // create new typed arrays
            self.vertices = new Float32Array(vertices);
            self.normals = new Float32Array(normals);
            if((vertices.length / 3) <= 65536)
            {
                self.indices = new Uint16Array(indices);
                self.indexType = 0x1403;
            }
            else
            {
                self.indices = new Uint32Array(indices);
                self.indexType = 0x1405;
            }

            // compute counters
            self.vertexCount = self.vertices.length / 3 || 0;
            self.normalCount = self.normals.length / 3 || 0;
            self.indexCount = self.indices.length || 0;
            self.triangleCount = self.indexCount / 3 || 0;
            self.fileType = "Binary";

            // compute bounding box
            computeBoundingBox(self);

        } // end of parseMeshBinary()

        function computeBoundingBox(self)
        {
            // prepare default bound with opposite values
            self.minX = Infinity;
            self.minY = Infinity;
            self.minZ = Infinity;
            self.maxX = -Infinity;
            self.maxY = -Infinity;
            self.maxZ = -Infinity;

            let v = new Vector3();
            let count = self.vertices.length;
            for(let i = 0; i < count; i += 3)
            {
                v.set(self.vertices[i], self.vertices[i+1], self.vertices[i+2]);
                self.minX = Math.min(v.x, self.minX);
                self.maxX = Math.max(v.x, self.maxX);
                self.minY = Math.min(v.y, self.minY);
                self.maxY = Math.max(v.y, self.maxY);
                self.minZ = Math.min(v.z, self.minZ);
                self.maxZ = Math.max(v.z, self.maxZ);
            }

            // compute center
            self.center.x = (self.maxX + self.minX) / 2.0;
            self.center.y = (self.maxY + self.minY) / 2.0;
            self.center.z = (self.maxZ + self.minZ) / 2.0;

            self.radius = 0;
            for(let i = 0; i < count; i += 3)
            {
                v.set(self.vertices[i], self.vertices[i+1], self.vertices[i+2]);
                self.radius = Math.max(self.radius, self.center.distance(v));
            }
            // fast estimate
            //self.radius = Math.max((self.maxX-self.minX)*0.5, (self.maxY-self.minY)*0.5, (self.maxZ-self.minZ)*0.5);
        }
    }, // end of read()

    ///////////////////////////////////////////////////////////////////////////
    // remormalize normal vectors
    normalize: function()
    {
        let count = this.normals.length;
        for(let i = 0; i < count; i += 3)
        {
            let invLength = 1.0 / Math.sqrt(this.normals[i]   * this.normals[i] +
                                            this.normals[i+1] * this.normals[i+1] +
                                            this.normals[i+2] * this.normals[i+2]);
            this.normals[i]   *= invLength;
            this.normals[i+1] *= invLength;
            this.normals[i+2] *= invLength;
        }
    },
    ///////////////////////////////////////////////////////////////////////////
    // clean up arrays
    clearArrays: function()
    {
        this.vertices = null;
        this.normals = null;
        this.indices = null;
        this.vertexCount = 0;
        this.normalCount = 0;
        this.indexCount = 0;
    },
    ///////////////////////////////////////////////////////////////////////////
    toString: function()
    {
        const FIXED = 100000;
        return "===== STL Model =====\n" +
               "Triangle Count: " + this.triangleCount + "\n" +
               "   Index Count: " + this.indexCount + "\n" +
               "  Vertex Count: " + this.vertexCount + "\n" +
               "  Normal Count: " + this.normalCount + "\n" +
               "     File Type: " + this.fileType + "\n" +
               "        Center: " + this.center + "\n" +
               "        Radius: " + Math.round(this.radius * FIXED) / FIXED + "\n";
    }
};



///////////////////////////////////////////////////////////////////////////////
// class (static) function: return vertex array of triangles as Vector3
///////////////////////////////////////////////////////////////////////////////
StlModel.toVertices = function(stl)
{
    let vertices = [];
    if(!stl || !(stl instanceof StlModel))
        return vertices;

    for(let i = 0; i < stl.indexCount; ++i)
    {
        let index = stl.indices[i] * 3;
        let v = new Vector3(stl.vertices[index], stl.vertices[index+1], stl.vertices[index+2]);
        vertices.push(v);
    }
    //log("VERTEX COUNT: " + vertices.length);
    return vertices;
}



///////////////////////////////////////////////////////////////////////////////
// class (static) function: generate face normal from 3 vertices
// PARAM: 3 Vector3 objects
///////////////////////////////////////////////////////////////////////////////
StlModel.generateFaceNormal = function(v1, v2, v3)
{
    let v12 = v2.subtract(v1);
    let v13 = v3.subtract(v1);
    return Vector3.cross(v12, v13).normalize();
}
