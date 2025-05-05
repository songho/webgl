///////////////////////////////////////////////////////////////////////////////
// ObjModel.js
// ===========
// Wavefront 3D object (.obj and .mtl) loader
// NOTE: call clearArrays() after copying data to opengl
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-12-19
// UPDATED: 2025-05-02
//
// Copyright (c) 2011. Song Ho Ahn
///////////////////////////////////////////////////////////////////////////////


let ObjGroup = function()
{
    this.name = "";         // group name
    this.materialName = ""; // "usemtl"
    this.indexOffset = 0;   // starting position of indices for this group
    this.indexCount = 0;    // number of indices for this group
};


let ObjModel = function()
{
    this.groupCount = 0;
    this.vertexCount = 0;
    this.normalCount = 0;
    this.texCoordCount = 0;
    this.indexCount = 0;
    this.triangleCount = 0;
    this.groups = [];
    this.vertices = null;
    this.normals = null;
    this.texCoords = null;
    this.indices = null;
    this.center = new Vector3();
    this.radius = 0;
    this.indexType = 0x1403; // UNSIGNED_SHORT or UNSIGNED_INT (0x1405)
    // dimension
    this.minX = 0;
    this.minY = 0;
    this.minZ = 0;
    this.maxX = 0;
    this.maxY = 0;
    this.maxZ = 0;
};

ObjModel.prototype =
{
    ///////////////////////////////////////////////////////////////////////////
    // return promise object
    read: function(file)
    {
        return new Promise((resolve, reject) =>
        {
            if(!file) reject("[ERROR] NULL OBJ filename");

            let self = this;

            // check object type
            if(file instanceof String || typeof file == "string")
            {
                // for remote file
                let xhr = new XMLHttpRequest();
                xhr.open("GET", file, true);
                xhr.send();
                // add event
                xhr.onload = function(e)
                {
                    if(xhr.status == 200) // OK
                    {
                        parseMesh(self, xhr.responseText);
                        resolve(self);
                    }
                    else
                    {
                        reject("[ERROR] Failed to load OBJ file: " + file + " (status:" + xhr.status + ")");
                    }
                };
                xhr.onerror = function(e)
                {
                    reject("[ERROR] Failed to load OBJ file: " + file);
                };
            }
            else if(file instanceof window.File)
            {
                // for local file using File API
                let reader = new FileReader();
                reader.readAsText(file);
                reader.onload = function(e)
                {
                    parseMesh(self, e.target.result);
                    resolve(self);
                };
                reader.onerror = function(e)
                {
                    reject("[ERROR] Failed to load OBJ file" + file.name);
                };
            }
        });

        // inner functions for read() =====================
        function parseMesh(self, buffer)
        {
            // clean up previous
            self.vertices = self.normals = self.texCoords = self.indices = null;
            self.groups.length = 0;

            // arrays for vertex, normal and texcoords
            let vertices = [];
            let normals = [];
            let texCoords = [];
            let indices = [];
            let vertexLookup = [];
            let normalLookup = [];
            let texCoordLookup = [];
            let indexLookup = {};
            let faces = {}; // temporal face indices as string
            let line, tokens, i, j, k;
            let currGroup = -1;

            // split to lines
            let lines = buffer.split(/\r\n|\r|\n/);
            for(i in lines)
            {
                line = lines[i];

                // skip comment line
                if(line.charAt(0) == "#")
                    continue;

                // start tokenizing
                tokens = line.split(" ");
                if(tokens.length <= 0)  // skip blank line
                    continue;

                // parse group
                if(tokens[0] == "g")
                {
                    let groupName = tokens[1];
                    let groupIndex = -1;
                    for(j in self.groups)
                    {
                        if(self.groups[j].name == groupName)
                            groupIndex = j;
                    }
                    if(groupIndex >= 0)
                        currGroup = groupIndex;
                    else
                    {
                        let group = new ObjGroup();
                        group.name = groupName;
                        self.groups.push(group);
                        currGroup = self.groups.length - 1;
                    }
                    //log("Group Name: " + tokens[1] + " INDEX: " + currGroup);
                }
                else if(tokens[0] == "mtllib")
                {
                    //@@ parse material file
                    //@@log("MTL Name: " + tokens[1]);
                }
                else if(tokens[0] == "usemtl")
                {
                    //@@ assign material
                    //@@log("USEMTL Name: " + tokens[1]);
                }
                else if(tokens[0] == "v")
                {
                    vertexLookup.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
                    //log("V: " + vertexLookup);
                }
                else if(tokens[0] == "vn")
                {
                    normalLookup.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
                    //log("N: " + normalLookup);
                }
                else if(tokens[0] == "vt")
                {
                    texCoordLookup.push(parseFloat(tokens[1]), 1.0 - parseFloat(tokens[2]));
                    //log("VT: " + texCoordLookup);
                }
                else if(tokens[0] == "f")
                {
                    let faceIndices;
                    if(tokens.length > 4)
                        faceIndices = convertToTriangles(tokens);
                    else
                        faceIndices = [tokens[1], tokens[2], tokens[3]]; // get 3 indices per face

                    let vi, ni, ti; // vertex, normal and texCoord index for lookup tables
                    let vi1, vi2, vi3;
                    let v1, v2, v3;
                    for(k = 0; k < faceIndices.length; k++)
                    {
                        // new face index
                        if(faces[faceIndices[k]] == undefined)
                        {
                            let indexStrings = faceIndices[k].split("/");

                            vi = 3 * (parseInt(indexStrings[0]) - 1); // compute vertex index

                            // add new vertex
                            vertices.push(vertexLookup[vi], vertexLookup[vi+1], vertexLookup[vi+2]);

                            if(indexStrings.length == 1) // vertex only
                            {
                                //@@ need to generate normals
                            }
                            else if(indexStrings.length == 2) // vertex and texCoord
                            {
                                //@@ need to generate normals here
                                ti = 2 * (parseInt(indexStrings[1]) - 1);
                                texCoords.push(texCoordLookup[ti], texCoordLookup[ti+1]); // add st coord
                            }
                            else if(indexStrings.length == 3) // vertex, texcoord and normal
                            {
                                ni = 3 * (parseInt(indexStrings[2]) - 1);
                                normals.push(normalLookup[ni], normalLookup[ni+1], normalLookup[ni+2]); // add normal
                                if(faceIndices[k].search("//") == -1) // has texCoord
                                {
                                    ti = 2 * (parseInt(indexStrings[1]) - 1);
                                    texCoords.push(texCoordLookup[ti], texCoordLookup[ti+1]); // add st coord
                                }
                            }

                            // add new index to the associative array
                            let ii = vertices.length / 3 - 1; // index of index array
                            faces[faceIndices[k]] = ii;
                            indices.push(ii);
                        }
                        // it is already in list, get the index from the list
                        else
                        {
                            // add it to only the index list
                            indices.push(faces[faceIndices[k]]);
                        }
                    } // end of for(k in faceIndices)
                } // end of if(tokens[0] == "f")
            } // end of for(i in lines)

            // if norams are not defined, generate face normals
            if(normals.length == 0)
            {
                let indexCount = indices.length;
                let i1, i2, i3;
                let v1, v2, v3;
                for(let i = 0; i < indexCount; i += 3)
                {
                    i1 = indices[i] * 3;
                    i2 = indices[i+1] * 3;
                    i3 = indices[i+2] * 3;
                    v1 = new Vector3(vertices[i1], vertices[i1+1], vertices[i1+2]);
                    v2 = new Vector3(vertices[i2], vertices[i2+1], vertices[i2+2]);
                    v3 = new Vector3(vertices[i3], vertices[i3+1], vertices[i3+2]);
                    let normal = ObjModel.generateFaceNormal(v1, v2, v3);
                    normals[i1] = normals[i2] = normals[i3] = normal.x;
                    normals[i1+1] = normals[i2+1] = normals[i3+1] = normal.y;
                    normals[i1+2] = normals[i2+2] = normals[i3+2] = normal.z;
                }
            }

            // create new typed arrays
            self.vertices = new Float32Array(vertices);
            self.normals = new Float32Array(normals);
            self.texCoords = new Float32Array(texCoords);
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
            self.texCoordCount = self.texCoords.length / 2 || 0;
            self.indexCount = self.indices.length || 0;
            self.triangleCount = self.indexCount / 3 || 0;

            // compute bounding box
            computeBoundingBox(self);

        } // end of parseMesh()

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

        function convertToTriangles(tokens)
        {
            let faceIndices = [];
            faceIndices.push(tokens[1]);
            faceIndices.push(tokens[2]);
            faceIndices.push(tokens[3]);

            let count = tokens.length;
            for(let i = 4; i < count; ++i)
            {
                faceIndices.push(tokens[i-1]);
                faceIndices.push(tokens[i]);
                faceIndices.push(tokens[1]);
            }
            return faceIndices;
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
        this.texCoords = null;
        this.indices = null;
        this.groups.length = 0;
        this.vertexCount = 0;
        this.normalCount = 0;
        this.texCoordCount = 0;
        this.indexCount = 0;
        this.groupCount = 0;
    },
    ///////////////////////////////////////////////////////////////////////////
    toString: function()
    {
        const FIXED = 100000;
        return "===== OBJ Model =====\n" +
               "Triangle Count: " + this.triangleCount + "\n" +
               "   Index Count: " + this.indexCount + "\n" +
               "   Group Count: " + this.groups.length + "\n" +
               "  Vertex Count: " + this.vertexCount + "\n" +
               "  Normal Count: " + this.normalCount + "\n" +
               "TexCoord Count: " + this.texCoordCount + "\n" +
               "        Center: " + this.center + "\n" +
               "        Radius: " + Math.round(this.radius * FIXED) / FIXED + "\n";
    }
};



///////////////////////////////////////////////////////////////////////////////
// class (static) function: return vertex array of triangles as Vector3
///////////////////////////////////////////////////////////////////////////////
ObjModel.toVertices = function(obj)
{
    let vertices = [];
    if(!obj || !(obj instanceof ObjModel))
        return vertices;

    for(let i = 0; i < obj.indexCount; ++i)
    {
        let index = obj.indices[i] * 3;
        let v = new Vector3(obj.vertices[index], obj.vertices[index+1], obj.vertices[index+2]);
        vertices.push(v);
    }
    //log("VERTEX COUNT: " + vertices.length);
    return vertices;
}



///////////////////////////////////////////////////////////////////////////////
// class (static) function: generate face normal from 3 vertices
// PARAM: 3 Vector3 objects
///////////////////////////////////////////////////////////////////////////////
ObjModel.generateFaceNormal = function(v1, v2, v3)
{
    let v12 = v2.subtract(v1);
    let v13 = v3.subtract(v1);
    return Vector3.cross(v12, v13).normalize();
}
