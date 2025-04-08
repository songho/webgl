///////////////////////////////////////////////////////////////////////////////
// Collada.js
// ==========
// COLLADA DAE loader
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-15
// UPDATED: 2021-09-22
//
// Copyright (C) 2012-2021. Song Ho Ahn
///////////////////////////////////////////////////////////////////////////////

// namespace
let Collada = window.Collada || {};



// constants //////////////////////////////////////////////////////////////////
Collada.DEG2RAD = Math.PI / 180;



// static functions ===========================================================

///////////////////////////////////////////////////////////////////////////////
// read collada DAE file
///////////////////////////////////////////////////////////////////////////////
Collada.read = function(file)
{
    return new Promise((resolve, reject) =>
    {
        if(!file) reject("[ERROR] NULL Collada filename");

        let schema = new Collada.Schema(); // create an instance of Collada schema
        let xhr = new XMLHttpRequest();
        xhr.open("GET", file, true);
        xhr.setRequestHeader("Content-Type", "text/xml");
        //xhr.responseType = "document";
        //xhr.overrideMimeType("text/xml");
        xhr.send();
        xhr.onload = function(e)
        {
            if(this.status == 200) // OK
            {
                // parse COLLADA document
                Collada.parse(schema, xhr.responseXML);
                resolve(schema);
                //log("Loaded DAE file: " + file);
            }
            else
            {
                reject("[ERROR] Failed to load DAE file: " + file + " (status:" + xhr.status + ")");
            }
        };
        xhr.onerror = function(e)
        {
            reject("[ERROR] Failed to load DAE file: " + file);

        };
    });
}



///////////////////////////////////////////////////////////////////////////////
// parse all COLLADA library elements
///////////////////////////////////////////////////////////////////////////////
Collada.parse = function(schema, xmlDoc)
{
    // use XPathResult
    //log("parsing geometry libs...");
    schema.libraryGeometries = Collada.parseLibrary("//dae:library_geometries/dae:geometry",
                                                    xmlDoc,
                                                    Collada.Geometry);
    //log("parsing animation libs...");
    schema.libraryAnimations = Collada.parseLibrary("//dae:library_animations/dae:animation",
                                                    xmlDoc,
                                                    Collada.Animation);
    //log("parsing visual libs...");
    schema.libraryVisualScenes = Collada.parseLibrary("//dae:library_visual_scenes/dae:visual_scene",
                                                      xmlDoc,
                                                      Collada.VisualScene);
    //log("parsing controller libs...");
    schema.libraryControllers = Collada.parseLibrary("//dae:library_controllers/dae:controller",
                                                     xmlDoc,
                                                     Collada.Controller);

    for(let geom of schema.libraryGeometries)
    {
        log("GEOM: " + geom.id + ", " + geom.name);

        for(let vert of geom.mesh.vertices)
        {
            let vertId = vert.id;
            let srcId = vert.input.source;
            let semantic = vert.input.semantic;
            log("VERT ID: " + vertId);
            log("VERT SRC ID: " + srcId + ", " + semantic);
            // get vertex data
            let src = geom.mesh.sources.find(s => s.id = srcId);
            log(src);
            vertData = src.data;
            log(vertData);
        }

        for(let poly of geom.mesh.polygons)
        {
            let vertData;
            let normData;
            let uvData;
            for(let input of poly.inputs)
            {
                if(input.semantic == "VERTEX")
                {
                    let vert = geom.mesh.vertices.find(v => v.id == input.source);
                    let src = geom.mesh.sources.find(s => s.id == vert.input.source);
                    vertData = src.data;
                    log(vertData);
                }
                else if(input.semantic == "NORMAL")
                {
                    let src = geom.mesh.sources.find(s => s.id == input.source);
                    normData = src.data;
                    log(normData);
                }
                else if(input.semantic == "TEXCOORD")
                {
                    let src = geom.mesh.sources.find(s => s.id == input.source);
                    uvData = src.data;
                    log(uvData);
                }
            }

            for(let p of poly.ps)
            {
                log(p);
            }
        }
    }
}



///////////////////////////////////////////////////////////////////////////////
// read a library_* element from COLLADA doc, return the array of the specified
// elements. libType is the class identifier
///////////////////////////////////////////////////////////////////////////////
Collada.parseLibrary = function(xpathExpression, xmlDoc, libType)
{
    try{

    // create XPathResult object from given XPath expreseesion
    let xpathResult = xmlDoc.evaluate(xpathExpression,                          // xpathExpression
                                      xmlDoc,                                   // content node
                                      Collada.namespaceResolver,                // function to NS resolver
                                      XPathResult.ORDERED_NODE_ITERATOR_TYPE,   // result type
                                      null);                                    // existing XPathResult
    let libs = [];
    while((node = xpathResult.iterateNext()) != null)
    {
        libs.push(libType.parse(node));
    }
    return libs;

    }catch(e){
        log("[ERROR] " + e.message);
        return [];
    }
};



///////////////////////////////////////////////////////////////////////////////
// associate "dae" prefix with ""http://www.collada.org/2005/11/COLLADASchema"
// namespace
///////////////////////////////////////////////////////////////////////////////
Collada.namespaceResolver = function(prefix)
{
    if(prefix == "dae")
        return "http://www.collada.org/2005/11/COLLADASchema";
    else
        return null;
}


///////////////////////////////////////////////////////////////////////////////
// convert string array to numeric type array
///////////////////////////////////////////////////////////////////////////////
Collada.convertToFloats = function(strArray)
{
    let data = [];
    for(let i = 0, c = strArray.length; i < c; ++i)
        data.push(parseFloat(strArray[i]));
    return data;
};
Collada.convertToInts = function(strArray)
{
    let data = [];
    for(let i = 0, c = strArray.length; i < c; ++i)
        data.push(parseInt(strArray[i]));
    return data;
};
Collada.convertToBools = function(strArray)
{
    let data = [];
    for(let i = 0, c = strArray.length; i < c; ++i)
    {
        if(strArray[i] == "true" || strArray[i] == "1")
            data.push(true);
        else
            data.push(false);
    }
    return data;
};



// classes ====================================================================

///////////////////////////////////////////////////////////////////////////////
// set of Collada metadata elements
// <library_geometries>, <library_animations>, <library_geometries>, etc...
///////////////////////////////////////////////////////////////////////////////
Collada.Schema = function()
{
    this.libraryGeometries = [];    // elements for <geometry>
    this.libraryAnimations = [];    // elements for <animation>
    this.libraryControllers = [];   // elements for <controller>
    this.libraryVisualScenes = [];  // elements for <visual_scene>
};
Collada.Schema.prototype.toString = function()
{
    return "===== Collada.Schema =====\n" +
           "   Geometry Count: " + this.libraryGeometries.length + "\n" +
           "  Animation Count: " + this.libraryAnimations.length + "\n" +
           " Controller Count: " + this.libraryControllers.length + "\n" +
           "VisualScene Count: " + this.libraryVisualScenes.length + "\n";
};



///////////////////////////////////////////////////////////////////////////////
// <geometry>
// declares geometry information, child of <library_geometries>
///////////////////////////////////////////////////////////////////////////////
Collada.Geometry = function()
{
    this.id = "";
    this.name = "";
    this.mesh = null;   // child class of geometry
};
Collada.Geometry.prototype.toString = function()
{
    return "===== Collada.Geometry =====\n" +
           "ID: " + this.id + "\n" +
           "Name: " + this.name + "\n" +
           "Mesh: \n" +
           this.mesh + "\n";
};
Collada.Geometry.parse = function(element)
{
    let geometry = new Collada.Geometry();
    geometry.id = element.getAttribute("id");
    geometry.name = element.getAttribute("name");
    log("parsing geometry..." + geometry.id);

    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let node = element.childNodes[i];
        if(node.nodeName == "mesh")
        {
            geometry.mesh = Collada.Mesh.parse(node);
        }
        else if(node.nodeName == "extra")
        {
            //@@log(node);
        }
    }
    log(geometry);
    return geometry;
};



///////////////////////////////////////////////////////////////////////////////
// <mesh>
// describes geometric meshes; lines, polygons, triangles, etc.
///////////////////////////////////////////////////////////////////////////////
Collada.Mesh = function()
{
    this.sources = [];
    this.lines = [];
    this.linestrips = [];
    this.polygons = [];
    this.polylist = [];
    this.spline = [];
    this.triangles = [];
    this.trifans = [];
    this.tristrips = [];
    this.vertices = [];
};
Collada.Mesh.prototype.toString = function()
{
    return "===== Collada.Mesh =====\n" +
           "   Sources Count: " + this.sources.length + "\n" +
           "     Lines Count: " + this.lines.length + "\n" +
           "Linestrips Count: " + this.linestrips.length + "\n" +
           "  Polygons Count: " + this.polygons.length + "\n" +
           "  Ploylist Count: " + this.polylist.length + "\n" +
           "    Spline Count: " + this.spline.length + "\n" +
           " Triangles Count: " + this.triangles.length + "\n" +
           "   Trifans Count: " + this.trifans.length + "\n" +
           " Tristrips Count: " + this.tristrips.length + "\n" +
           "  Vertices Count: " + this.vertices.length + "\n";
};
Collada.Mesh.parse = function(element)
{
    log("parsing mesh...");
    let mesh = new Collada.Mesh();
    mesh.primitives = [];

    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let node = element.childNodes[i];
        switch(node.nodeName)
        {
        case "source":
            let source = Collada.Source.parse(node);
            mesh.sources.push(source);
            //log(mesh);
            //@@source(node);
            break;

        case "lines":
            //log("lines");
            //@@log("[WARNING] lines are not supported.");
            break;

        case "linestrips":
            //log("linestrips");
            //@@log("[WARNING] linestrips are not supported.");
            break;

        case "polygons":
            let poly = Collada.Polygons.parse(node);
            mesh.polygons.push(poly);
            log(poly);
            //log("polygons");
            break;

        case "polylist":
            //log("polylist");
            //let polylist = Collada.Polylist.parse(node);
            //mesh.polylist.push(polylist);
            //@@log("[WARNING] lines are not supported.");
            break;

        case "spline":
            //log("spline");
            //let s = Collada.Spline.parse(node);
            //mesh.spline.push(s);
            //@@log("[WARNING] lines are not supported.");
            break;

        case "triangles":
            //log("triangles");
            let tris= Collada.Triangles.parse(node);
            mesh.triangles.push(tris);
            break;

        case "trifans":
            //log("tripans");
            //@@log("[WARNING] trifans are not supported.");
            break;

        case "tristrips":
            //log("tristrips");
            //@@log("[WARNING] trifans are not supported.");
            break;

        case "vertices":
            let vert = Collada.Vertices.parse(node);
            mesh.vertices.push(vert);
            break;
        }
    }

/*
    mesh.geometry3js = new THREE.Geometry();

    var vertexData = Collada.sources[mesh.vertices.input["POSITION"].source].data;
    for(var i = 0; i < vertexData.length; i += 3)
    {
        var v = new THREE.Vertex(getConvertedVec3(vertexData, i));
        mesh.geometry3js.vertices.push(v);
    }

    for (var i = 0; i < this.primitives.length; ++i)
    {
        var primitive = mesh.primitives[i];
        primitive.setVertices(mesh.vertices);
        mesh.handlePrimitive(primitive, mesh.geometry3js);
    }

    mesh.geometry3js.computeCentroids();
    mesh.geometry3js.computeFaceNormals();
    mesh.geometry3js.computeVertexNormals();
    mesh.geometry3js.computeBoundingBox();
*/

    log(mesh);
    return mesh;
};

/*
Collada.Mesh.prototype =
{
    handlePrimitive: function(primitive, geom)
    {
        var i, j, k;
        var input, index, idx32;
        var source, numParams;
        var vcIndex = 0, vcount = 3;
        var texture_sets = [];

        for(i = 0; i < inputs.length; ++i)
        {
            input = inputs[i];
            if(input.semantic == "TEXCOORD")
            {
                texture_sets.push(input.set);
            }
        }

        i = 0;
        var p = primitive.p;
        var inputs = primitive.inputs;
        while(i < p.length)
        {
            var vs = [];
            var ns = [];
            var ts = {};
            var cs = [];

            if(primitive.vcount)
                vcount = primitive.vcount[vcIndex++];

            for(j = 0; j < vcount; ++j)
            {
                for(k = 0; k < inputs.length; ++k)
                {
                    input = inputs[k];
                    source = sources[input.source];

                    index = p[i + (j * inputs.length) + input.offset];
                    numParams = source.accessor.params.length;
                    idx32 = index * numParams;

                    switch(input.semantic)
                    {
                    case "VERTEX":
                        vs.push(index);
                        break;

                    case "NORMAL":
                        ns.push(getConvertedVec3(source.data, idx32));
                        break;

                    case "TEXCOORD":
                        if(ts[input.set] === undefined)
                            ts[input.set] = [];
                        // invert the V
                        //@@ts[input.set].push(new THREE.UV(source.data[idx32], 1.0 - source.data[idx32 + 1]));
                        break;

                    case "COLOR":
                        //@@cs.push(new THREE.Color().setRGB(source.data[idx32], source.data[idx32 + 1], source.data[idx32 + 2]));
                        break;
                    }
                }
            }

            var face = null, faces = [], uv, uvArr;
            if(vcount == 3)
            {
                //@@faces.push(new THREE.Face3( vs[0], vs[1], vs[2], [ ns[0], ns[1], ns[2] ], cs.length ? cs : new THREE.Color() ) );
            }
            else if(vcount == 4)
            {
                //@@faces.push( new THREE.Face4( vs[0], vs[1], vs[2], vs[3], [ ns[0], ns[1], ns[2], ns[3] ], cs.length ? cs : new THREE.Color() ) );
            }
            else if(vcount > 4 && options.subdivideFaces)
            {
                var clr = cs.length ? cs : new THREE.Color(),
                vec1, vec2, vec3, v1, v2, norm;

                // subdivide into multiple Face3s
                for(k = 1; k < vcount-1;)
                {
                    // FIXME: normals don't seem to be quite right
                    //@@faces.push( new THREE.Face3( vs[0], vs[k], vs[k+1], [ ns[0], ns[k++], ns[k] ],  clr ) );
                }
            }

            if(faces.length)
            {
                for(var ndx = 0, len = faces.length; ndx < len; ++ndx)
                {
                    face = faces[ndx];
                    face.daeMaterial = primitive.material;
                    geom.faces.push(face);

                    for(k = 0; k < texture_sets.length; ++k)
                    {
                        uv = ts[ texture_sets[k] ];
                        if(vcount > 4)
                        {
                            // Grab the right UVs for the vertices in this face
                            uvArr = [ uv[0], uv[ndx+1], uv[ndx+2] ];
                        }
                        else if(vcount == 4)
                        {
                            uvArr = [ uv[0], uv[1], uv[2], uv[3] ];
                        }
                        else
                        {
                            uvArr = [ uv[0], uv[1], uv[2] ];
                        }

                        if(!geom.faceVertexUvs[k])
                        {
                            geom.faceVertexUvs[k] = [];
                        }

                        geom.faceVertexUvs[k].push( uvArr );
                    }
                }
            }
            else
            {
                //@@log("dropped face with vcount " + vcount + " for geometry with id: " + geom.id);
            }

            i += inputs.length * vcount;
        }
    },
};
*/





///////////////////////////////////////////////////////////////////////////////
// <source>
// declare data repository that <input> element refere to it
///////////////////////////////////////////////////////////////////////////////
Collada.Source = function()
{
    this.id = "";
    this.name = "";
    this.type = ""; // IDREF_array, Name_array, bool_array, float_array, OR int_array
    this.data = null;
    this.accessor = null;
};
Collada.Source.prototype.toString = function()
{
    return "===== Collada.Source =====\n" +
           "        ID: " + this.id + "\n" +
           "      Type: " + this.type + "\n" +
           "Data Count: " + this.data.length + "\n" +
           "  Accessor: " + this.accessor.source + "\n";
};
Collada.Source.parse = function(element)
{
    let source = new Collada.Source();

    source.id = element.getAttribute("id");
    log("Parsing source..." + source.id);
    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let node = element.childNodes[i];
        if(node.nodeName == "float_array")
        {
            source.type = node.nodeName;
            source.data = Collada.convertToFloats(node.textContent.trim().split(/\s+/));
            log("float_array: " + source.data);
        }
        else if(node.nodeName == "int_array")
        {
            source.type = node.nodeName;
            source.data = Collada.convertToInts(node.textContent.trim().split(/\s+/));
            log("int_array: " + source.data);
        }
        else if(node.nodeName == "bool_array")
        {
            source.type = node.nodeName;
            source.data = Collada.convertToBools(node.textContent.trim().split(/\s+/));
            log("bool_array: " + source.data);
        }
        else if(node.nodeName == "Name_array")
        {
            source.type = node.nodeName;
            source.data = node.textContent.trim().split(/\s+/);
            log("Name_array: " + source.data);
        }
        else if(node.nodeName == "IDREF_array")
        {
            source.type = node.nodeName;
            source.data = node.textContent.trim().split(/\s+/);
            log("IDREF_array: " + source.data);
        }
        else if(node.nodeName == "technique_common")
        {
            for(let i = 0, c = node.childNodes.length; i < c; ++i)
            {
                if(node.childNodes[i].nodeName == "accessor")
                {
                    source.accessor = Collada.Accessor.parse(node.childNodes[i]);
                    break;
                }
            }
        }
    }

    log(source);
    return source;
};



///////////////////////////////////////////////////////////////////////////////
// <input> (shared)
// declare connection to the data source
///////////////////////////////////////////////////////////////////////////////
Collada.Input = function()
{
    this.source = "";   // location ID of data source
    this.semantic = ""; // POSITION, NORMAL, TEXCOORD, COLOR, etc.
    this.offset = 0;    // index offset in <p> or <v>
    this.set = 0;       // group (optional)
};
Collada.Input.prototype.toString = function()
{
    return "===== Collada.Input =====\n" +
           "  Source: " + this.source + "\n" +
           "Semantic: " + this.semantic + "\n" +
           "  Offset: " + this.offset + "\n" +
           "     Set: " + this.set + "\n";
};
Collada.Input.parse = function(element)
{
    let input = new Collada.Input();
    input.semantic = element.getAttribute("semantic").replace(/^#/, "");
    input.source = element.getAttribute("source").replace(/^#/, "");
    input.offset = element.hasAttribute("offset") ? parseInt(element.getAttribute("offset")) : 0;
    input.set = element.hasAttribute("set") ? parseInt(element.getAttribute("set")) : 0;

    //log(input);
    return input;
};



///////////////////////////////////////////////////////////////////////////////
// <accessor> describes access pattern of data source
///////////////////////////////////////////////////////////////////////////////
Collada.Accessor = function()
{
    this.source = "";   // source ID
    this.count = 0;
    this.offset = 0;
    this.stride = 1;
    this.params = [];   // array types: int, float, bool, Name, IDREF
};
Collada.Accessor.prototype.toString = function()
{
    let paramStr = "[ ";
    for(let i = 0, c = this.params.length; i < c; ++i)
    {
        let param = this.params[i];
        paramStr += "{" + param.name + ":" + param.type + "}";
        if(i < (c-1))
            paramStr += ",";
    }
    paramStr += " ]";

    return "===== Collada.Accessor =====\n" +
           "Source: " + this.source + "\n" +
           " Count: " + this.count + "\n" +
           "Offset: " + this.offset + "\n" +
           "Stride: " + this.stride + "\n" +
           "Params: " + paramStr + "\n";
};
Collada.Accessor.parse = function(element)
{
    let accessor = new Collada.Accessor();
    accessor.source = element.getAttribute("source").replace(/^#/, "");
    log("parsing accessor..." + accessor.source);
    accessor.count = element.hasAttribute("count") ? parseInt(element.getAttribute("count")) : 0;
    accessor.stride = element.hasAttribute("stride") ? parseInt(element.getAttribute("stride")) : 0;

    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let child = element.childNodes[i];
        if(child.nodeName == "param")
        {
            // param node has "name" and "type" attrib
            let param = {};
            param.name = child.getAttribute("name");
            param.type = child.getAttribute("type");
            accessor.params.push(param);
        }
    }
    log(accessor);
    return accessor;
};



///////////////////////////////////////////////////////////////////////////////
// <vertices>
// describe vertices info
///////////////////////////////////////////////////////////////////////////////
Collada.Vertices = function()
{
    this.id = "";
    this.input = {};    // only POSITION semantic
};
Collada.Vertices.prototype.toString = function()
{
    return "===== Collada.Vertices =====\n" +
           "   ID: " + this.id + "\n" +
           "Input: source=" + this.input.source + ", semantic=" + this.input.semantic + "\n";
};
Collada.Vertices.parse = function(element)
{
    let vertices = new Collada.Vertices();
    vertices.id = element.getAttribute("id");
    log("parsing vertices..." + vertices.id);

    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        if(element.childNodes[i].nodeName == "input")
        {
            // only store semantic="POSITION" and source="source_ID"
            let input = Collada.Input.parse(element.childNodes[i]);
            vertices.input.semantic = input.semantic;
            vertices.input.source = input.source;
        }
    }
    //log(vertices);
    return vertices;
};



///////////////////////////////////////////////////////////////////////////////
// <polygons>
// declare bindings of vertex attributes for mesh
// NOTE: Use <polygons> only if holes are needed
// NOTE: "p" stands for "primitive"
///////////////////////////////////////////////////////////////////////////////
Collada.Polygons = function()
{
    this.material = "";
    this.count = 0;     // polygon count
    this.inputs = [];   // V-N-T-C etc.
    this.ps = [];       // indices (uint) for polygonal primitives
    this.phs = [];      // indices for polygons with holes
};
Collada.Polygons.prototype.toString = function()
{
    return "===== Collada.Polygons =====\n" +
           "       Material: " + this.material + "\n" +
           "  Polygon Count: " + this.count + "\n" +
           "    Input Count: " + this.inputs.length + "\n" +
           "Primitive Count: " + this.ps.length + "\n";
};
Collada.Polygons.parse = function(element)
{
    let polygons = new Collada.Polygons();
    polygons.material = element.getAttribute("material");
    log("parsing polygons..." + polygons.material);
    polygons.count = parseInt(element.getAttribute("count")) || 0;
    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let node = element.childNodes[i];
        switch(node.nodeName)
        {
        case "input":
            let input = Collada.Input.parse(node);
            polygons.inputs.push(input);
            log(input);
            break;

        case "p":
            let p = Collada.convertToInts(node.textContent.trim().split(/\s+/));
            polygons.ps.push(p);
            break;
        }
    }
    log(polygons);
    return polygons;
};



///////////////////////////////////////////////////////////////////////////////
// <polylist>
// declare bindings of vertex attributes for mesh
// NOTE: "p" stands for primitives
///////////////////////////////////////////////////////////////////////////////
Collada.Polylist = function()
{
    this.material = "";
    this.count = 0;     // polylist count
    this.inputs = [];   // V-N-T-C etc.
    this.vcount = [];   // list of vertex counts per polylist
    this.ps = [];       // indices (uint) for polylists
};
Collada.Polylist.prototype.tostring = function()
{
    return "===== Collada.Polylist =====\n" +
           "       Material: " + this.material + "\n" +
           " Polylist Count: " + this.count + "\n" +
           "    Input Count: " + this.inputs.length + "\n" +
           "   Vcount Count: " + this.vcount.length + "\n" +
           "Primitive Count: " + this.ps.length + "\n";
};
Collada.Polylist.prototype.parse = function(element)
{
    let polylist = new Collada.Polylist();
    polygons.material = element.getAttribute("material");
    log("parsing polylist..." + polylist.material);
    polylist.count = parseInt(element.getAttribute("count")) || 0;
    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let node = element.childNodes[i];
        switch(node.nodeName)
        {
        case "input":
            let input = Collada.Input.parse(node);
            polylist.inputs.push(input);
            //log(input);
            break;

        case "vcount":
            polylist.vcount = Collada.convertToInts(node.textContent.trim().split(/\s+/));
            //log(polylist.vcount);
            break;

        case "p":
            let p = Collada.convertToInts(node.textContent.trim().split(/\s+/));
            polylist.ps.push(p);
            break;
        }
    }
    log(polylist);
    return polylist;
};




///////////////////////////////////////////////////////////////////////////////
// <triangles>
// declare bindings of vertex attributes for mesh
// NOTE: "p" stands for primitive
///////////////////////////////////////////////////////////////////////////////
Collada.Triangles = function()
{
    this.material = "";
    this.count = 0;     // triangle count
    this.inputs = [];   // V-N-T-C
    //this.vcount = null;
    this.ps = [];       // indices (uint) for triangle primitives
};
Collada.Triangles.prototype.toString = function()
{
    return "===== Collada.Triangles =====\n" +
           "       Material: " + this.material + "\n" +
           " Triangle Count: " + this.count + "\n" +
           "    Input Count: " + this.inputs.length + "\n" +
           "Primitive Count: " + this.ps.length + "\n";
};
/*
Collada.Triangles.setVertices = function(vertices)
{
    for(let i = 0, c = this.inputs.length; i < c; ++i)
    {
        if(this.inputs[i].source == vertices.id)
        {
            this.inputs[i].source = vertices.input["POSITION"].source;
        }
    }
};
*/
Collada.Triangles.parse = function(element)
{
    let triangles = new Collada.Triangles();
    triangles.material = element.getAttribute("material");
    log("parsing triangles..." + triangles.material);
    triangles.count = parseInt(element.getAttribute("count")) || 0;
    triangles.inputs = [];

    for(let i = 0, c = element.childNodes.length; i < c; ++i)
    {
        let node = element.childNodes[i];
        switch(node.nodeName)
        {
        case "input":
            let input = Collada.Input.parse(node);
            triangles.inputs.push(input);
            break;

        case "p":
            let p = Collada.convertToInts(node.textContent.trim().split(/\s+/));
            triangles.ps.push(p);
            break;
        }
    }
    log(triangles);
    return triangles;
};






///////////////////////////////////////////////////////////////////////////////
// <animation> declares animation information, child of <library_animations>
///////////////////////////////////////////////////////////////////////////////
Collada.Animation = function()
{
    this.id = "";
    this.name = "";
    this.sources = [];
    this.samplers = [];
    this.channels = [];
};
Collada.Animation.prototype.toString = function()
{
    return "===== Collada.Animation =====\n" +
           "            ID: " + this.id + "\n" +
           "          Name: " + this.name + "\n" +
           " Sources Count: " + this.sources.length + "\n" +
           "Samplers Count: " + this.samplers.length + "\n" +
           "Channels Count: " + this.channels.length + "\n";
};
///////////////////////////////////////////////////////////////////////////////
// parse single <animation> node
// <animation> node contains <source>, <sampler> <channel> sub nodes
///////////////////////////////////////////////////////////////////////////////
Collada.Animation.parse = function(element)
{
    var animation = new Collada.Animation();
    animation.id = element.getAttribute("id");
    animation.name = element.getAttribute("name");

    for(var i = 0, count = element.childNodes.length; i < count; ++i)
    {
        var node = element.childNodes[i];
        if(node.nodeType != 1)  // only interested in ELEMENT_NODE
                continue;

        if(node.nodeName == "source")
        {
            var src = Collada.Source.parse(node);
            animation.sources.push(src);
        }
        else if(node.nodeName == "sampler")
        {
            var sampler = Collada.Sampler.parse(node, animation);
            animation.samplers.push(sampler);
        }
        else if(node.nodeName == "channel")
        {
            var channel = Collada.Channel.parse(node, animation);
            animation.channels.push(channel);
        }
    }

    log(animation);
    return animation;
};



///////////////////////////////////////////////////////////////////////////////
// <channel> describes output channel (where to store transform values) of an animation
///////////////////////////////////////////////////////////////////////////////
Collada.Channel = function(animation)
{
    this.animation = animation;
    this.source = "";   // location of sampler
    this.target = "";   // target transform
    this.id = "";       // target ID
    this.sid = "";      // target scoped id
    this.hasMemberAccess = false;
    this.member = null;
    this.hasArrayAccess = false;
    this.arrayIndices = [];
};
Collada.Channel.prototype.toString = function()
{
    var str = "===== Collada.Channel =====\n" +
              "Animation ID: " + this.animation.id + "\n" +
              "      Source: " + this.source + "\n" +
              "      Target: " + this.target + "\n" +
              "         SID: " + this.sid + "\n";

    if(this.hasMemberAccess)
        str += "Member: " + this.member + "\n";
    else if(this.hasArrayAccess)
        str += "Array Count: " + this.arrayIndices.length + "\n";

    return str;
};
Collada.Channel.parse = function(element, animation)
{
    var channel = new Collada.Channel(animation);
    channel.source = element.getAttribute("source").replace(/^#/, ""); // trim "#" prefix
    channel.target = element.getAttribute("target");

    var targetParts = channel.target.split("/");
    channel.id = targetParts[0];
    channel.sid = targetParts[1];    // scoped ID

    channel.hasMemberAccess = (channel.sid.indexOf(".") >= 0);
    channel.hasArrayAccess = (channel.sid.indexOf("(") >= 0);

    if(channel.hasMemberAccess)
    {
        var parts = channel.sid.split(".");
        channel.sid = parts[0];
        channel.member = parts[1];
    }
    else if(channel.hasArrayAccess)
    {
        channel.arrayIndices = channel.sid.split("(");
        channel.sid = channel.arrayIndices.shift().trim();

        for(var i = 0; i < channel.arrayIndices.length; ++i)
        {
            channel.arrayIndices[i] = parseInt(channel.arrayIndices[i].replace(/\)/, ""));
        }
    }

    log(channel);
    return channel;
};



///////////////////////////////////////////////////////////////////////////////
// <sampler>, interpolation sampling function for an animation
///////////////////////////////////////////////////////////////////////////////
Collada.Sampler = function(animation)
{
    this.animation = animation;
    this.id = "";
    this.inputs = [];
    this.input = null;
    this.output = null;
    this.strideOut = null;
    this.interpolation = null;
    this.startTime = null;
    this.endTime = null;
    this.duration = 0;
};
Collada.Sampler.prototype.toString = function()
{
    return "===== Collada.Sampler =====\n" +
           "         ID: " + this.id + "\n" +
           "Input Count: " + this.inputs.length + "\n" +
           "   Duration: " + this.duration + "\n";
};
Collada.Sampler.parse = function(element, animation)
{
    var sampler = new Collada.Sampler(animation);
    sampler.id = element.getAttribute("id");

    for(var i = 0, count = element.childNodes.length; i < count; ++i)
    {
        var node = element.childNodes[i];
        if(node.nodeType != 1) continue; // only ELEMENT_NODE

        if(node.nodeName == "input")
        {
            var input = Collada.Input.parse(node);
            sampler.inputs.push(input);
        }
    }
    log(sampler);
    return sampler;
};

/*
Collada.Sampler.create = function()
{
    for(var i = 0; i < this.inputs.length; ++i)
    {
        var input = this.inputs[i];
            var source = this.animation.sources[input.source];

            switch(input.semantic)
            {
            case "INPUT":
                this.input = source.read();
                break;

            case "OUTPUT":
                this.output = source.read();
                this.strideOut = source.accessor.stride;
                break;

            case "INTERPOLATION":
                this.interpolation = source.read();
                break;

            case "IN_TANGENT":
                break;

            case "OUT_TANGENT":
                break;
            }
        }

        this.startTime = 0;
        this.endTime = 0;
        this.duration = 0;
        if(this.input.length)
        {
            this.startTime = 100000000;
            this.endTime = -100000000;
            for(var i = 0; i < this.input.length; ++i)
            {
                this.startTime = Math.min(this.startTime, this.input[i]);
                this.endTime = Math.max(this.endTime, this.input[i]);
            }
            this.duration = this.endTime - this.startTime;
        }
    },
    getData: function(type, ndx)
    {
        var data;
        if(this.strideOut > 1)
        {
            data = [];
            ndx *= this.strideOut;
            for(var i = 0; i < this.strideOut; ++i)
            {
                data[i] = this.output[ndx + i];
            }

            if(this.strideOut === 3)
            {
                switch(type)
                {
                case "rotate":
                case "translate":
                    fixCoords(data, -1);
                    break;

                case "scale":
                    fixCoords(data, 1);
                    break;
                }
            }
        }
        else
        {
            data = this.output[ndx];
        }
        return data;
    }
};
*/



///////////////////////////////////////////////////////////////////////////////
// <visual_scene>
///////////////////////////////////////////////////////////////////////////////
Collada.VisualScene = function()
{
    this.id = "";
    this.name = "";
    this.nodes = [];
};
Collada.VisualScene.prototype.toString = function()
{
    return "===== Collada.VisualScene =====\n" +
           "        ID: " + this.id + "\n" +
           "      Name: " + this.name + "\n" +
           "Node Count: " + this.nodes.length + "\n";
};
Collada.VisualScene.parse = function(element)
{
    var visualScene = new Collada.VisualScene();
    visualScene.id = element.getAttribute("id");
    visualScene.name = element.getAttribute("name");

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var child = element.childNodes[i];
        if(child.nodeType != 1) // only ELEMENT_NODE
            continue;

        if(child.nodeName == "node")
        {
            var node = Collada.Node.parse(child);
            visualScene.nodes.push(node);
        }
    }

    log(visualScene);
    return visualScene;
};
Collada.VisualScene.prototype =
{
    getChildById: function(id, recursive)
    {
        for(var i = 0; i < this.nodes.length; ++i)
        {
            var node = this.nodes[i].getChildById(id, recursive);
            if(node)
                return node;
        }
        return null;
    },
    getChildBySid: function(sid, recursive)
    {
        for(var i = 0; i < this.nodes.length; ++i)
        {
            var node = this.nodes[i].getChildBySid(sid, recursive);
            if(node)
                return node;
        }
        return null;
    }
};



///////////////////////////////////////////////////////////////////////////////
// <node>
///////////////////////////////////////////////////////////////////////////////
Collada.Node = function()
{
    this.id = "";
    this.name = "";
    this.sid = "";
    this.nodes = [];
    this.controllers = [];
    this.transforms = [];
    this.geometries = [];
    this.channels = [];
    //this.matrix = new Matrix4();
};
Collada.Node.parse = function(element)
{
    var node = new Collada.Node();
    node.id = element.getAttribute("id");
    node.sid = element.getAttribute("sid");
    node.name = element.getAttribute("name");
    node.type = element.getAttribute("type");
    //node.type = (node.type == "JOINT") ? node.type : "NODE";

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var child = element.childNodes[i];
        if(child.nodeType != 1) // only ELEMENT_NODE
            continue;

        if(child.nodeName == "node")
        {
            var childNode = Collada.Node.parse(child);
            node.nodes.push(childNode);
        }
        else if(child.nodeName == "instance_camera")
        {
        }
        else if(child.nodeName == "instance_controller")
        {
            //var instanceController = Collada.InstanceController.parse(child);
            //node.controllers.push(instanceController);
        }
        else if(child.nodeName == "instance_geometry")
        {
            //@@var instanceGeometry = Collada.InstanceGeometry.parse(child);
            //@@node.geometries.push(instanceGeometry);
        }
        else if(child.nodeName == "instance_light")
        {
        }
        else if(child.nodeName == "instance_node")
        {
            //@@var url = child.getAttribute("url").replace(/^#/, "");
            //@@var iNode = getLibraryNode(url);
            //@@if(iNode)
            //@@{
            //@@    var n = Collada.Node.parse(iNode);
            //@@    node.nodes.push(n);
            //@@}
        }
        else if(child.nodeName == "rotate" || child.nodeName == "translate" ||
                child.nodeName == "scale"  || child.nodeName == "matrix"    ||
                child.nodeName == "lookat" || child.nodeName == "skew")
        {
            //@@var transform = Collada.Transform.parse(child);
            //@@node.transforms.push(transform);
        }
        else if(child.nodeName == "extra")
        {
        }
    }

    //@@node.channels = getChannelsForNode(node);
    //@@bakeAnimations(node);
    //@@node.updateMatrix();
    log(node);
    return node;
};
Collada.Node.prototype =
{
    getChildById: function(id, recursive)
    {
        if(this.id == id)
            return this;

        if(recursive)
        {
            for(var i = 0; i < this.nodes.length; ++i)
            {
                var node = this.nodes[i].getChildById(id, recursive);
                if(node)
                    return node;
            }
        }
        return null;
    },
    getChildBySid: function(sid, recursive)
    {
        if(this.sid == sid)
            return this;

        if(recursive)
        {
            for(var i = 0; i < this.nodes.length; ++i)
            {
                var node = this.nodes[i].getChildBySid(sid, recursive);
                if(node)
                    return node;
            }
        }
        return null;
    },
    getTransformBySid: function(sid)
    {
        for(var i = 0; i < this.transforms.length; ++i)
        {
            if(this.transforms[i].sid == sid)
                return this.transforms[i];
        }
        return null;
    },
    getChannelForTransform: function(transformSid)
    {
        for(var i = 0; i < this.channels.length; ++i)
        {
            if(channels[i].sid == transformSid)
                return channel;
        }
        return null;
    },
    updateMatrix: function()
    {
        this.matrix.identity();
        for(var i = 0; i < this.transforms.length; ++i)
        {
            this.transforms[i].apply(this.matrix);
        }
    },
    toString: function()
    {
        return "===== Collada.Node =====\n" +
               "               ID: " + this.id + "\n" +
               "             Name: " + this.name + "\n" +
               "              SID: " + this.sid + "\n" +
               "      Nodes Count: " + this.nodes.length + "\n" +
               "Controllers Count: " + this.controllers.length + "\n" +
               " Transforms Count: " + this.transforms.length + "\n" +
               " Geometries Count: " + this.geometries.length + "\n" +
               "   Channels Count: " + this.channels.length + "\n";
    }
};



///////////////////////////////////////////////////////////////////////////////
// <transform>
///////////////////////////////////////////////////////////////////////////////
Collada.Transform = function()
{
    this.sid = "";
    this.type = "";
    this.data = [];
    this.obj = null;
};
Collada.Transform.prototype =
{
    convert: function()
    {
        switch(this.type)
        {
        case "matrix":
            this.obj = getConvertedMat4(this.data);
            break;
        case "rotate":
            this.angle = this.data[3] * DEG2RAD;
            break;
        case "translate":
            fixCoords(this.data, -1);
            this.obj = new Vector3(this.data[0], this.data[1], this.data[2]);
            break;
        case "scale":
            fixCoords(this.data, 1);
            this.obj = new Vector3(this.data[0], this.data[1], this.data[2]);
            break;
        }
    },
    apply: function(matrix)
    {
        switch(this.type)
        {
        case "matrix":
            //@@matrix.multiply(this.obj);
            break;
        case "translate":
            //@@matrix.translate(this.obj.x, this.obj.y, this.obj.z);
            break;
        case "rotate":
            //@@matrix.rotate(this.angle, this.obj.x, this.obj.y, this.obj.z);
            break;
        case "scale":
            matrix.scale(this.obj);
            break;
        }
    },
    update: function(data, member)
    {
        switch(this.type)
        {
        case "matrix":
            break;

        case "translate":
        case "scale":
            switch(member)
            {
            case "X":
                this.obj.x = data;
                break;
            case "Y":
                this.obj.y = data;
                break;
            case "Z":
                this.obj.z = data;
                break;
            default:
                this.obj.set(data[0], data[1], data[2]);
                break;
            }
            break;

        case "rotate":
            switch(member)
            {
            case "X":
                this.obj.x = data;
                break;
            case "Y":
                this.obj.y = data;
                break;
            case "Z":
                this.obj.z = data;
                break;
            case "ANGLE":
                this.angle = data * DEG2RAD;
                break;
            default:
                this.obj.set(data[0], data[1], data[2]);
                this.angle = data[3] * TO_RADIANS;
                break;
            }
            break;
        }
    },
    toString: function()
    {
        return "===== Collada.Transform =====\n" +
               "       SID: " + this.sid + "\n" +
               "      Type: " + this.type + "\n" +
               "Data Count: " + this.data.length + "\n";
    }
};
///////////////////////////////////////////////////////////////////////////////
// parse <transform> node
///////////////////////////////////////////////////////////////////////////////
Collada.Transform.parse = function(element)
{
    var transform = new Transform();
    transform.sid = element.getAttribute("sid");
    transform.type = element.nodeName;
    transform.data = Collada.convertToFloats(element.textContent);
    transform.convert();
    log(transform);
    return transform;
};



///////////////////////////////////////////////////////////////////////////////
// <instance_controller>
///////////////////////////////////////////////////////////////////////////////
Collada.InstanceController = function()
{
    this.url = "";
    this.skeletons = [];
    this.instanceMaterials = [];
};
Collada.InstanceController.prototype.toString = function()
{
    return "===== Collada.InstanceController =====\n" +
           "                    URL: " + this.url + "\n" +
           "        Skeletons Count: " + this.skeletons.length + "\n" +
           "InstanceMaterials Count: " + this.instanceMaterials.length + "\n";
};
Collada.InstanceController.parse = function(element)
{
    var controller = new InstanceController();
    controller.url = element.getAttribute("url").replace(/^#/, "");

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var node = element.childNodes[i];
        if (node.nodeType != 1)
            continue;

        switch(node.nodeName)
        {
        case "skeleton":
            controller.skeletons.push(node.textContent.replace(/^#/, ""));
            break;
        case "bind_material":
            var instances = COLLADA.evaluate(".//dae:instance_material", node, Collada.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            if(instances)
            {
                var instance;
                while((instance = instances.iterateNext()) != null)
                {
                    var material = Collada.InstanceMaterial.parse(instance);
                    controller.instanceMaterials.push(material);
                }
            }
            break;
        case "extra":
            break;
        }
    }
    log(controller);
    return controller;
};





///////////////////////////////////////////////////////////////////////////////
// <instance_material>
///////////////////////////////////////////////////////////////////////////////
Collada.InstanceMaterial = function()
{
    this.symbol = "";
    this.target = "";
};
Collada.InstanceMaterial.prototype.toString = function()
{
    return "===== Collada.InstanceMaterial =====\n" +
           "Symbol: " + this.symbol + "\n" +
           "Target: " + this.target + "\n";
};
///////////////////////////////////////////////////////////////////////////////
// parse <instance_material> node
///////////////////////////////////////////////////////////////////////////////
Collada.InstanceMaterial.parse = function(element)
{
    var material = new InstanceMaterial();
    material.symbol = element.getAttribute("symbol");
    material.target = element.getAttribute("target").replace(/^#/, "");
    log(material);
    return material;
};



///////////////////////////////////////////////////////////////////////////////
// <instance_geometry>
// instantiate geometry described by <geometry> element
///////////////////////////////////////////////////////////////////////////////
Collada.InstanceGeometry = function()
{
    this.url = "";
    this.instanceMaterials = [];
};
Collada.InstanceGeometry.prototype.toString = function()
{
    return "===== Collada.InstanceGeometry =====\n" +
           "                    URL: " + this.url + "\n" +
           "InstanceMaterials Count: " + this.instanceMaterials.length + "\n";
};
Collada.InstanceGeometry.parse = function(element)
{
    var geometry = new Collada.InstanceGeometry();
    geometry.url = element.getAttribute("url").replace(/^#/, "");

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var node = element.childNodes[i];
        if(node.nodeType != 1)
            continue;

        if(node.nodeName == "bind_material")
        {
            var instances = COLLADA.evaluate(".//dae:instance_material", node, Collada.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            if(instances)
            {
                var instance = null;
                while((instance = instances.iterateNext()) != null)
                {
                    var material = Collada.InstanceMaterial.parse(instance);
                    geometry.instanceMaterials.push(material);
                }
            }
            break;
        }
    }
    log(geometry);
    return geometry;
};



///////////////////////////////////////////////////////////////////////////////
// <controller>
///////////////////////////////////////////////////////////////////////////////
Collada.Controller = function()
{
    this.id = "";
    this.name = "";
    this.type = "";
    this.skin = null;
    this.morph = null;
};
Collada.Controller.prototype.toString = function()
{
    return "===== Collada.Controller =====\n" +
           "  ID: " + this.id + "\n" +
           "Name: " + this.name + "\n" +
           "Type: " + this.type + "\n";
};
Collada.Controller.parse = function(element)
{
    var controller = new Collada.Controller();
    controller.id = element.getAttribute("id");
    controller.name = element.getAttribute("name");
    controller.type = "none";

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var node = element.childNodes[i];
        switch(node.nodeName)
        {
        case "skin":
            controller.skin = Collada.Skin.parse(node);
            controller.type = node.nodeName;
            break;

        case "morph":
            controller.morph = Collada.Morph.parse(node);
            controller.type = node.nodeName;
            break;
        }
    }
    log(controller);
    return controller;
};



///////////////////////////////////////////////////////////////////////////////
// <morph>
///////////////////////////////////////////////////////////////////////////////
Collada.Morph = function()
{
    this.method = null;
    this.source = null;
    this.targets = null;
    this.weights = null;
};
Collada.Morph.parse = function(element)
{
    var morph = new Collada.Morph();
    var sources = {};
    var inputs = [];

    morph.method = element.getAttribute("method");
    morph.source = element.getAttribute("source" ).replace(/^#/, "");

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var node = element.childNodes[i];
        if(node.nodeType != 1)
            continue;

        switch(node.nodeName)
        {
        case "source":
            var source = Collada.Source.parse(node);
            Collada.sources[source.id] = source;
            break;

        case "targets":
            inputs = morph.parseInputs(node);
            break;
        }
    }

    for(var i = 0; i < inputs.length; ++i)
    {
        var input = inputs[i];
        var source = sources[input.source];

        switch(input.semantic)
        {
        case "MORPH_TARGET":
            morph.targets = source.read();
            break;

        case "MORPH_WEIGHT":
            morph.weights = source.read();
            break;
        }
    }
    return morph;
};
Collada.Morph.prototype =
{
    parseInputs: function(element)
    {
        var inputs = [];
        for(var i = 0; i < element.childNodes.length; ++i)
        {
            var node = element.childNodes[i];
            if(node.nodeType != 1)
                continue;

            if(node.nodeName == "input")
            {
                var input = Collada.Input.parse(node);
                inputs.push(input);
            }
        }
        return inputs;
    },
    toString: function()
    {
        return "===== Collada.Morph =====\n";
    }
};



///////////////////////////////////////////////////////////////////////////////
// <skin>
///////////////////////////////////////////////////////////////////////////////
Collada.Skin = function()
{
    this.source = "";
    this.bindShapeMatrix = null;
    this.invBindMatrices = [];
    this.joints = [];
    this.weights = [];
};
Collada.Skin.parse = function(element)
{
    var skin = new Collada.Skin();
    var sources = {};
    var joints, weights;

    skin.source = element.getAttribute("source").replace(/^#/, "");
    skin.invBindMatrices = [];
    skin.joints = [];
    skin.weights = [];

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var node = element.childNodes[i];
        if(node.nodeType != 1)
            continue;

        switch(node.nodeName)
        {
        case "bind_shape_matrix":
            var f = Collada.convertToFloats(node.textContent);
            skin.bindShapeMatrix = getConvertedMat4(f);
            break;

        case "source":
            var src = Collada.Source.parse(node);
            sources[src.id] = src;
            break;

        case "joints":
            joints = node;
            break;

        case "vertex_weights":
            weights = node;
            break;
        }
    }

    skin.parseJoints(joints, sources);
    skin.parseWeights(weights, sources);

    return skin;
};
Collada.Skin.prototype =
{
    parseJoints: function(element, sources)
    {
        for(var i = 0; i < element.childNodes.length; ++i)
        {
            var node = element.childNodes[i];
            if(node.nodeType != 1)
                continue;

            if(node.nodeName == "input")
            {
                var input = Collada.Input.parse(node);
                var source = sources[input.source];

                if(input.semantic == "JOINT")
                {
                    this.joints = source.read();
                }
                else if(input.semantic == "INV_BIND_MATRIX")
                {
                    this.invBindMatrices = source.read();
                }
            }
        }
    },
    parseWeights: function(element, sources)
    {
        var v, vcount, inputs = [];
        for(var i = 0; i < element.childNodes.length; ++i)
        {
            var node = element.childNodes[i];
            if(node.nodeType != 1)
                continue;

            if(node.nodeName == "input")
            {
                var input = Collada.Input.parse(node);
                inputs.push(input);
            }
            else if(node.nodeName == "v")
            {
                v = Collada.convertToInts(node.textContent);
            }
            else if(node.nodeName == "vcount")
            {
                vcount = Collada.convertToInts(node.textContent);
            }
        }

        var index = 0;
        for(var i = 0; i < vcount.length; ++i)
        {
            var boneCount = vcount[i];
            var vertexWeights = [];
            for(var j = 0; j < numBones; ++j)
            {
                var influence = {};
                for(var k = 0; k < inputs.length; ++k)
                {
                    var input = inputs[k];
                    var value = v[index + input.offset];

                    if(input.semantic == "JOINT")
                    {
                        influence.joint = value;//this.joints[value];
                    }
                    else if(input.semantic == "WEIGHT")
                    {
                        influence.weight = sources[input.source].data[value];
                    }
                }

                vertexWeights.push(influence);
                index += inputs.length;
            }

            for(var j = 0; j < vertex_weights.length; ++j)
            {
                vertexWeights[j].index = i;
            }

            this.weights.push(vertex_weights);
        }
    },
    toString: function()
    {
        return "===== Collada.Skin =====\n" +
               "Source: " + this.source + "\n";
    }
};



///////////////////////////////////////////////////////////////////////////////
// <material>
///////////////////////////////////////////////////////////////////////////////
Collada.Material = function()
{
    this.id = "";
    this.name = "";
    this.instanceEffect = null;
};
Collada.Material.prototype.toString = function()
{
    return "===== Collada.Material =====\n" +
           "  ID: " + this.id + "\n" +
           "Name: " + this.name + "\n";
};
Collada.Material.parse = function(element)
{
    var material = new Collada.Material();
    material.id = element.getAttribute("id");
    material.name = element.getAttribute("name");

    for(var i = 0; i < element.childNodes.length; ++i)
    {
        if(element.childNodes[i].nodeName == "instance_effect")
        {
            material.instanceEffect = Collada.InstanceEffect.parse(element.childNodes[i]);
            break;
        }
    }
    log(material);
    return material;
};






///////////////////////////////////////////////////////////////////////////////
// <shader>
///////////////////////////////////////////////////////////////////////////////
Collada.Shader = function()
{
    this.stage = "";
    this.sources = [];
    this.compiler = {};
};
Collada.Shader.prototype.toString = function()
{
    return "===== Collada.Shader =====\n" +
           "Stage: " + this.stage + "\n";
};
Collada.Shader.parse = function(element)
{
    var shader = new Collada.Shader();
    for(var i = 0; i < element.childNodes.length; ++i)
    {
        var node = element.childNodes[i];
        if(node.nodeType != 1)
            continue;

        switch(node.nodeName)
        {
        case "ambient":
        case "emission":
        case "diffuse":
        case "specular":
        case "transparent":
            shader[node.nodeName] = ( new ColorOrTexture() ).parse(node);
            break;

        case "shininess":
        case "reflectivity":
        case "transparency":
            var f = evaluateXPath(node, ".//dae:float");
            if(f.length > 0)
                this[node.nodeName] = parseFloat(f[0].textContent);
            break;
        }
    }

    shader.create();
    return shader;
};



///////////////////////////////////////////////////////////////////////////////
// <effect>
///////////////////////////////////////////////////////////////////////////////
Collada.Effect = function()
{
    this.id = "";
    this.name = "";
    this.shader = null;
    this.surface = null;
    this.sampler = null;
};



///////////////////////////////////////////////////////////////////////////////
// <key>
///////////////////////////////////////////////////////////////////////////////
Collada.Key = function(time)
{
    this.targets = [];
    this.time = time;
};
Collada.Key.prototype =
{
    addTarget: function(fullSid, transform, member, data)
    {
        this.targets.push({ sid:fullSid, member:member, transform:transform, data:data });
    },
    apply: function(opt_sid)
    {
        for(var i = 0; i < this.targets.length; ++i)
        {
            var target = this.targets[i];
            if(!opt_sid || target.sid == opt_sid)
            {
                target.transform.update(target.data, target.member);
            }
        }
    },
    getTarget: function(fullSid)
    {
        for(var i = 0; i < this.targets.length; ++i)
        {
            if(this.targets[i].sid == fullSid)
            {
                return this.targets[i];
            }
        }
        return null;
    },
    hasTarget: function(fullSid)
    {
        for(var i = 0; i < this.targets.length; ++i)
        {
            if(this.targets[i].sid == fullSid)
            {
                return true;
            }
        }
        return false;
    },
    //@@ TODO: Currently only doing linear interpolation. Should support full COLLADA spec.
    interpolate: function(nextKey, time)
    {
        for(var i = 0; i < this.targets.length; ++i)
        {
            var target = this.targets[i];
            var nextTarget = nextKey.getTarget(target.sid);
            var data;
            if(nextTarget)
            {
                var scale = (time - this.time) / (nextKey.time - this.time);
                var nextData = nextTarget.data;
                var prevData = target.data;

                // check scale error
                if(scale < 0 || scale > 1)
                {
                    //@@console.log( "Key.interpolate: Warning! Scale out of bounds:" + scale );
                    scale = scale < 0 ? 0 : 1;
                }

                if(prevData.length)
                {
                    data = [];
                    for(var j = 0; j < prevData.length; ++j)
                    {
                        data[j] = prevData[j] + (nextData[j] - prevData[j]) * scale;
                    }
                }
                else
                {
                    data = prevData + (nextData - prevData) * scale;
                }
            }
            else
            {
                data = target.data;
            }

            target.transform.update(data, target.member);
        }
    }
};




/*
    read: function()
    {
        var result = [];
		var param = this.accessor.params[0];
		switch(param.type)
        {
		case "IDREF":
		case "Name":
		case "float":
		case "int":
    		return this.data;

		case "float4x4":
			for(var j = 0; j < this.data.length; j += 16)
            {
				var s = this.data.slice(j, j + 16);
				var m = getConvertedMat4(s);
				result.push(m);
			}
			break;
        }
		return result;
    },
};
*/









