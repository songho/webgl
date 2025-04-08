///////////////////////////////////////////////////////////////////////////////
// BoundingBox.js
// ==============
// rectangular bounding box
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-24
// UPDATED: 2024-07-04
///////////////////////////////////////////////////////////////////////////////

let BoundingBox = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[WARNING] BoundingBox.contructor requires GL context as a param.");

    // 8 vertices
    this.v1 = new Vector3();    // (minX, minY, minZ)
    this.v2 = new Vector3();    // (minX, minY, maxZ)
    this.v3 = new Vector3();    // (minX, maxY, minZ)
    this.v4 = new Vector3();    // (minX, maxY, maxZ)
    this.v5 = new Vector3();    // (maxX, minY, minZ)
    this.v6 = new Vector3();    // (maxX, minY, maxZ)
    this.v7 = new Vector3();    // (maxX, maxY, minZ)
    this.v8 = new Vector3();    // (maxX, maxY, maxZ)
};

BoundingBox.prototype =
{
    set: function(minX, maxX, minY, maxY, minZ, maxZ)
    {
        this.v1.set(minX, minY, minZ);
        this.v2.set(minX, minY, maxZ);
        this.v3.set(minX, maxY, minZ);
        this.v4.set(minX, maxY, maxZ);
        this.v5.set(maxX, minY, minZ);
        this.v6.set(maxX, minY, maxZ);
        this.v7.set(maxX, maxY, minZ);
        this.v8.set(maxX, maxY, maxZ);
        return this;
    },
    clone: function()
    {
        let bbox = new BoundingBox(this.gl);
        bbox.set(this.v1.x, this.v5.x,
                 this.v1.y, this.v3.y,
                 this.v1.z, this.v2.z);
        return bbox;
    },
    getCenterX: function()
    {
        return (this.v1.x + this.v5.x) / 2;     // (minX + maxX) / 2
    },
    getCenterY: function()
    {
        return (this.v1.y + this.v3.y) / 2;     // (minY + maxY) / 2
    },
    getCenterZ: function()
    {
        return (this.v1.z + this.v2.z) / 2;     // (minZ + maxZ) /2
    },
    toString: function()
    {
        return "BoundingBox: (" +
               this.v1.x.toFixed(3) + ", " + this.v1.y.toFixed(3) + ", " + this.v1.z.toFixed(3) + ") - (" +
               this.v8.x.toFixed(3) + ", " + this.v8.y.toFixed(3) + ", " + this.v8.z.toFixed(3) + ")";
    }
};