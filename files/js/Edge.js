///////////////////////////////////////////////////////////////////////////////
// Edge.js
// =======
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2014-08-26
// UPDATED: 2020-09-30
///////////////////////////////////////////////////////////////////////////////

let Edge = function()
{
    this.vertex1 = new Vector3();
    this.vertex2 = new Vector3();
    this.normal1 = new Vector3();
    this.normal2 = new Vector3();
};
Edge.prototype =
{
    toString: function()
    {
        let s = "===== Edge =====\n" +
                "Vertex1: " + this.vertex1 + "\n" +
                "Vertex2: " + this.vertex2 + "\n" +
                "Normal1: " + this.normal1 + "\n" +
                "Normal2: " + this.normal2 + "\n";
        return s;
    }
};


///////////////////////////////////////////////////////////////////////////////
// class (static) function: return all edges from polygons
///////////////////////////////////////////////////////////////////////////////
Edge.generateEdges = function(vertices)
{
    let edges = []; // return array

    for(let i = 0, count = vertices.length; i < count; i += 3)
    {
        let v1 = vertices[i].clone();
        let v2 = vertices[i+1].clone();
        let v3 = vertices[i+2].clone();

        // compute face normal
        v2.subtract(v1);
        v3.subtract(v1);
        let n = Vector3.cross(v2, v3).normalize();

        // v2 & v3 are changed, must re-get v2 & v3
        v2 = vertices[i+1].clone();
        v3 = vertices[i+2].clone();

        let e = []; // 3 edges per triangle
        e[0] = new Edge();
        e[0].vertex1.set(v1.x, v1.y, v1.z);
        e[0].vertex2.set(v2.x, v2.y, v2.z);
        e[0].normal1.set(n.x, n.y, n.z);

        e[1] = new Edge();
        e[1].vertex1.set(v2.x, v2.y, v2.z);
        e[1].vertex2.set(v3.x, v3.y, v3.z);
        e[1].normal1.set(n.x, n.y, n.z);

        e[2] = new Edge();
        e[2].vertex1.set(v3.x, v3.y, v3.z);
        e[2].vertex2.set(v1.x, v1.y, v1.z);
        e[2].normal1.set(n.x, n.y, n.z);

        for(let j = 0; j < 3; ++j)
        {
            let edgeIndex = Edge.findIndex(edges, e[j]);
            if(edgeIndex < 0)
            {
                edges.push(e[j]);
            }
            else
            {
                edges[edgeIndex].normal2.set(n.x, n.y, n.z);
            }
        }
    }
    return edges;
};



///////////////////////////////////////////////////////////////////////////////
// class (static) function: return hard edges with given angle (degree)
///////////////////////////////////////////////////////////////////////////////
Edge.generateHardEdges = function(edges, angle)
{
    let hardEdges = [];
    let radian = angle * Math.PI / 180;
    for(let i = 0, count = edges.length; i < count; ++i)
    {
        let dot = edges[i].normal1.dot(edges[i].normal2);
        if(dot < -1)
            dot = -1;
        else if(dot > 1)
            dot = 1;

        if(Math.acos(dot) >= radian)
        {
            hardEdges.push(edges[i]);
        }
    }
    return hardEdges;
};



///////////////////////////////////////////////////////////////////////////////
// class (static) function: return silhouette edges
///////////////////////////////////////////////////////////////////////////////
Edge.generateOutlineEdges = function(edges, matrix)
{
    let outlineEdges = [];
    let eye = new Vector3(0, 0, 1);

    for(let i = 0, count = edges.length; i < count; ++i)
    {
        let e = edges[i];

        let n1 = new Vector3(e.normal1.x, e.normal1.y, e.normal1.z);
        let n2 = new Vector3(e.normal2.x, e.normal2.y, e.normal2.z);
        n1 = matrix.transform(n1);
        n2 = matrix.transform(n2);

        let a1 = eye.dot(n1);
        let a2 = eye.dot(n2);
        if((a1 * a2) < 0)
        {
            outlineEdges.push(e);
        }
    }
    return outlineEdges;
};



///////////////////////////////////////////////////////////////////////////////
// class (static) function: return index of edge if found. otherwise return -1
///////////////////////////////////////////////////////////////////////////////
Edge.findIndex = function(edges, edge)
{
    for(let i = 0, count = edges.length; i < count; ++i)
    {
        let e = edges[i];
        if((edge.vertex1.x == e.vertex2.x && edge.vertex1.y == e.vertex2.y && edge.vertex1.z == e.vertex2.z) &&
           (edge.vertex2.x == e.vertex1.x && edge.vertex2.y == e.vertex1.y && edge.vertex2.z == e.vertex1.z))
        {
            return i;
        }
    }
    return -1;
};



///////////////////////////////////////////////////////////////////////////////
// class (static) function: return Float32 array from edge array
///////////////////////////////////////////////////////////////////////////////
Edge.toFloat32Array = function(edges)
{
    let count = edges.length;
    let index = 0;
    let vertices = new Float32Array(count * 2 * 3);

    for(let i = 0; i < count; ++i)
    {
        index = i * 6;
        vertices[index]   = edges[i].vertex1.x;
        vertices[index+1] = edges[i].vertex1.y;
        vertices[index+2] = edges[i].vertex1.z;
        vertices[index+3] = edges[i].vertex2.x;
        vertices[index+4] = edges[i].vertex2.y;
        vertices[index+5] = edges[i].vertex2.z;
    }
    return vertices;
};
