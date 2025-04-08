///////////////////////////////////////////////////////////////////////////////
// Plane.js
// ========
// class for a 3D plane with normal vector (a,b,c) and a point (x0,y0,z0)
// ax + by + cy + d = 0     where d = -(ax0 + by0 + cz0)
//
// NOTE:
// 1. The default plane is z = 0. (a plane on XY axis)
// 2. The distance is the length from the origin to the plane.
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2016-04-18
// UPDATED: 2020-09-30
///////////////////////////////////////////////////////////////////////////////

let Plane = function(a, b, c, d)
{
    this.normal = new Vector3(a, b, c);
    this.d = d || 0;
    this.normalLength = Math.sqrt(a*a + b*b + c*c);
    this.distance = -this.d / this.normalLength;
};

Plane.prototype =
{
    set: function(a, b, c, d)
    {
        this.normal.set(a, b, c);
        this.d = d;
        this.normalLength = Math.sqrt(a*a + b*b + c*c);
        this.distance = -this.d / this.normalLength;
        return this;
    },
    setWithNormalAndPoint: function(normal, point)
    {
        this.normal.set(normal.x, normal.y, normal.z);
        this.normalLength = this.normal.length();
        this.d = -normal.dot(point);
        this.distance = -this.d / this.normalLength;
        return this;
    },
    ///////////////////////////////////////////////////////////////////////////
    // return the shortest distance between plane and a given point
    // NOTE: this distance is signed. If it is negagtive, the point is opposite
    // side of the plane.
    // D = (a * Px + b*Py + c*Pz + d) / sqrt(a*a + b*b + c*c)
    ///////////////////////////////////////////////////////////////////////////
    getDistance: function(point)
    {
        if(point instanceof Vector3)
        {
            let dot = this.normal.dot(point);
            return (dot + this.d) / this.normalLength;
        }
        else
        {
            return this.distance;
        }
    },
    ///////////////////////////////////////////////////////////////////////////
    // normalize the normal vector of the plane
    ///////////////////////////////////////////////////////////////////////////
    normalize: function()
    {
        let invLength = 1 / this.normalLength;
        this.normal.scale(invLength);
        this.normalLength = 1;
        this.d *= invLength;
        this.distance = -this.d;
        return this;
    },
    ///////////////////////////////////////////////////////////////////////////
    // find the intersection of line or plane
    ///////////////////////////////////////////////////////////////////////////
    intersect: function(obj)
    {
        // intersect with a line
        if(obj instanceof Line)
        {
            let d1 = this.normal.dot(obj.point);
            let d2 = this.normal.dot(obj.direction);

            // if denominator=0, no intersect
            if(d2 == 0)
                return new Vector3(NaN, NaN, NaN);

            let t = -(d1 + this.d) / d2;
            let v = obj.direction.clone();
            v.scale(t);
            let p = obj.point.clone();
            p.add(v);
            return p;
        }
        // intersect with another plane
        else if(obj instanceof Plane)
        {
            let v = Vector3.cross(this.normal, obj.normal);
            if(v.x == 0 && v.y == 0 && v.z == 0)
                return new Line(NaN, NaN, NaN, NaN, NaN, NaN);

            let vv = v.dot(v);
            let n = this.normal.clone().scale(obj.d);
            n.add(obj.normal.clone().scale(-this.d));
            let p = Vector3.cross(n, v);
            p.scale(1 / vv);
            return new Line(p, v);
        }
    },
    isIntersected: function(obj)
    {
        if(obj instanceof Line)
        {
            let dot = this.normal.dot(obj.direction);
            if(dot == 0)
                return false;
            else
                return true;
        }
        else if(obj instanceof Plane)
        {
            let v = Vector3.cross(this.normal, obj.normal);
            if(v.x == 0 && v.y == 0 && v.z == 0)
                return false;
            else
                return true;
        }
    },
    toString: function()
    {
        return "Plane(" + this.normal.x + ", " + this.normal.y + ", " + this.normal.z + ", " + this.d + ")\n";
    }
};
