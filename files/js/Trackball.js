///////////////////////////////////////////////////////////////////////////////
// Trackball.js
// ============
// This class takes the current mouse cursor position (x,y), and map it to the
// point (x,y,z) on the trackball(sphere) surface. Since the cursor point is in
// screen space, this class depends on the current screen width and height in
// order to compute the vector on the sphere.
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-12-15
// UPDATED: 2020-09-30
//
// Copyright (C) 2011. Song Ho Ahn
///////////////////////////////////////////////////////////////////////////////

let Trackball = function(r=0, w=0, h=0)
{
    this.radius = r;
    this.screenWidth = w;
    this.screenHeight = h;
};

Trackball.prototype =
{
    set: function(r, w, h)
    {
        this.radius = r;
        this.screenWidth = w;
        this.screenHeight = h;
        return this;
    },
    setRadius: function(r)
    {
        this.radius = r;
        return this;
    },
    setScreenSize: function(w, h)
    {
        this.screenWidth = w;
        this.screenHeight = h;
        return this;
    },
    // return the point on the trackball with given mouse position
    getVector: function(x, y)
    {
        let vec = new Vector3(0,0,0);

        if(this.radius == 0 || this.screenWidth == 0 || this.screenHeight == 0)
            return vec;

        // compute mouse position from the centre of screen
        vec.x = x - this.screenWidth * 0.5;
        vec.y = this.screenHeight * 0.5 - y;    // OpenGL uses bottom-up orientation

        let d = vec.x * vec.x + vec.y * vec.y;
        let r = this.radius * this.radius;
        // use sphere if d<=0.5*r^2:  z = sqrt(r^2 - (x^2 + y^2))
        if(d <= (r * 0.5))
        {
            vec.z = Math.sqrt(r - d);
        }
        // use hyperbolic sheet if d>0.5*r^2:  z = (r^2 / 2) / sqrt(x^2 + y^2)
        // referenced from trackball.c by Gavin Bell at SGI
        else
        {
            vec.z = 0.5 * r / Math.sqrt(d);

            // scale x and y down, so the vector can be on the sphere
            // y = ax => x^2 + (ax)^2 + z^2 = r^2 => (1 + a^2)*x^2 = r^2 - z^2
            // => x = sqrt((r^2 - z^2) / (1 - a^2)
            let x2, y2, a;
            if(vec.x == 0.0)    // avoid dividing by 0
            {
                x2 = 0.0;
                y2 = Math.sqrt(r - vec.z * vec.z);
                if(vec.y < 0)   // correct sign
                    y2 = -y2;
            }
            else
            {
                a = vec.y / vec.x;
                x2 = Math.sqrt((r - vec.z*vec.z) / (1 + a*a));
                if(vec.x < 0)   // correct sign
                    x2 = -x2;
                y2 = a * x2;
            }
            vec.x = x2;
            vec.y = y2;
        }
        return vec;
    },
    // return the point on the sphere as a unit vector
    getUnitVector: function(x, y)
    {
        return this.getVector(x, y).normalize();
    },
    toString: function()
    {
        return "===== Trackball =====\n" +
               "     Radius: " + this.radius + "\n" +
               "Screen Size: (" + this.screenWidth + ", " + this.screenHeight + ")\n";
    }
};
