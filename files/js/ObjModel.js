///////////////////////////////////////////////////////////////////////////////
// ObjModel.js
// ===========
// Wavefront 3D object (.obj and .mtl) loader
// NOTE: call clearArrays() after copying data to opengl
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-12-19
// UPDATED: 2020-10-26
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
                                //@@ need to compute normals here
                            }
                            else if(indexStrings.length == 2)
                            {
                                if(faceIndices[k].search("//") > 0) // vertex and normal
                                {
                                    // add new normal
                                    ni = 3 * (parseInt(indexStrings[1]) - 1); // compute normal lookup index
                                    normals.push(normalLookup[ni], normalLookup[ni+1], normalLookup[ni+2]); // add normal
                                }
                                else
                                {
                                    //@@ need to generate normals here
                                    ti = 2 * (parseInt(indexStrings[1]) - 1);
                                    texCoords.push(texCoordLookup[ti], texCoordLookup[ti+1]); // add st coord
                                }
                            }
                            else if(indexStrings.length == 3) // vertex, texcoord and normal
                            {
                                ni = 3 * (parseInt(indexStrings[2]) - 1);
                                ti = 2 * (parseInt(indexStrings[1]) - 1);
                                normals.push(normalLookup[ni], normalLookup[ni+1], normalLookup[ni+2]); // add normal
                                texCoords.push(texCoordLookup[ti], texCoordLookup[ti+1]); // add st coord
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

            // create new typed arrays
            self.vertices = new Float32Array(vertices);
            self.normals = new Float32Array(normals);
            self.texCoords = new Float32Array(texCoords);
            self.indices = new Uint16Array(indices);

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
};
