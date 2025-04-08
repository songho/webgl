///////////////////////////////////////////////////////////////////////////////
// Line.js
// =======
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2021-11-12
///////////////////////////////////////////////////////////////////////////////

let Line = function(x1, y1, z1, x2, y2, z2)
{
    if(arguments.length == 6)   // (x1,y1,z1), (x2,y2,z2)
    {
        this.point = new Vector3(x1, y1, z1);
        this.direction = new Vector3(x2-x1, y2-y1, z2-z1);
    }
    else if(arguments.length == 2)  // v1, v2
    {
        this.point = x1.clone();
        this.direction = y1.clone();
    }
    else
    {
        this.point = new Vector3();
        this.direction = new Vector3();
    }
};

Line.prototype =
{
    ///////////////////////////////////////////////////////////////////////////
    // set line with 2 points
    ///////////////////////////////////////////////////////////////////////////
    set: function(x1, y1, z1, x2, y2, z2)
    {
        if(arguments.length == 6)
        {
            this.point.set(x1, y1, z1);
            this.direction.set(x2-x1, y2-y1, z2-z1);
        }
        else if(arguments.length == 2)
        {
            this.point.set(x1);
            this.direction.set(y1.x - x1.x, y1.y - x1.y, y1.z - x1.z);
        }
        return this;
    },
    setDirection: function(dir)
    {
        this.direction.set(dir.x, dir.y, dir.z);
        return this;
    },
    setPoint: function(p)
    {
        this.point.set(p.x, p.y, p.z);
        return this;
    },
    ///////////////////////////////////////////////////////////////////////////
    // return Vector3 if intersected, otherwise NaN point
    ///////////////////////////////////////////////////////////////////////////
    intersect: function(line)
    {
        let a = Vector3.cross(this.direction, line.direction);
        let dot = a.dot(a);
        if(dot == 0)
            return new Vector3(NaN, NaN, NaN);

        let p = this.point.clone();
        let v = line.point.clone().subtract(this.point);
        let b = Vector3.cross(v, line.direction);
        let t = b.dot(a) / dot;

        v = this.direction.clone().scale(t);
        return p.add(v);
    },
    isIntersected: function(line)
    {
        let a = Vector3.cross(this.direction, line.direction);
        if(a.x == 0 && a.y == 0 && a.z == 0)
            return false;
        else
            return true;
    },
    toString: function()
    {
        return "Line: (" + this.point.x + ", " + this.point.y + ", " + this.point.z +
               ") + t(" + this.direction.x + ", " + this.direction.y + ", " + this.direction.z + ")";
    }
};

