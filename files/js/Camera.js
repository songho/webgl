///////////////////////////////////////////////////////////////////////////////
// Camera.js
// =========
// camera class
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-16
// UPDATED: 2021-07-09
///////////////////////////////////////////////////////////////////////////////

let Camera = function(x, y, z)
{
    this.position = new Vector3(x, y, z);
    this.target = new Vector3(0, 0, 0);
    this.distance = this.position.distance(this.target);
    this.offset = new Vector2(0, 0);
    this.quaternion = new Quaternion(1, 0, 0, 0);
    this.matrix = new Matrix4();

    this.maxMoveSpeed = 1;
    this.maxTurnSpeed = 1;
    this.maxZoomSpped = 1;
    this.moveAccel = 1;
    this.turnAccel = 1;
    this.zoomAccel = 1;

    // offset animation
    this.shifting = false;
    this.shiftTime = 0;
    this.shiftSpeed = 0;
    this.shiftVector = new Vector2(0, 0);   // direction vector

    // zoom in/out animation
    this.zooming = false;
    this.zoomTime = 0;
    this.zoomSpeed = 0;
    this.zoomDir = 0;   // in:-1, out:+1
};

Camera.prototype =
{
    update: function()
    {
        this.matrix.identity();
        // for trackball
        this.matrix.translate(-this.target.x, -this.target.y, -this.target.z);
        this.matrix = this.quaternion.toMatrix().multiply(this.matrix);
        //@@ use position as well
        //@@this.matrix.translate(-this.position.x, -this.position.y, -this.position.distance(this.target));
        //@@this.matrix.translate(-this.offset.x, -this.offset.y, 0);
        this.matrix.translate(-this.offset.x, -this.offset.y, -this.distance);
        return this.matrix;
    },

    moveTo: function(to, duration, mode, callback)
    {
        if(!duration)
            duration = 0;
        if(!mode)
            mode = AnimationMode.LINEAR;

        callback = callback || function(){};
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.target.clone();
        let self = this;
        requestAnimationFrame(moveToCallback);
        function moveToCallback()
        {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            if(time >= endTime)
            {
                self.target.set(to.x, to.y, to.z);
                self.update();
                callback();
                return;
            }

            self.target = Vector3.interpolate(from, to, alpha, mode);
            self.update();
            requestAnimationFrame(moveToCallback);
        }
        return this;
    },

    moveDistanceTo: function(to, duration, mode, callback)
    {
        if(!duration)
            duration = 0;
        if(!mode)
            mode = AnimationMode.LINEAR;

        callback = callback || function(){};
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.distance;
        let self = this;
        requestAnimationFrame(moveDistanceToCallback);
        function moveDistanceToCallback()
        {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            if(time >= endTime)
            {
                self.distance = to;
                self.update();
                callback();
                return;
            }

            alpha = getInterpolateAlpha(alpha, mode);
            self.distance = from +  (to - from) * alpha;
            self.update();
            requestAnimationFrame(moveDistanceToCallback);
        }
        return this;
    },

    rotateTo: function(to, duration, mode, callback)
    {
        if(!duration)
            duration = 0;

        callback = callback || function(){};
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.quaternion.clone();
        let self = this;
        requestAnimationFrame(rotateToCallback);
        function rotateToCallback()
        {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            alpha = getInterpolateAlpha(alpha, mode); // get non-linear alpha
            if(time >= endTime)
            {
                self.quaternion.set(to.s, to.x, to.y, to.z);
                self.update();
                callback();
                return;
            }

            self.quaternion = Quaternion.slerp(from, to, alpha);
            self.update();
            requestAnimationFrame(rotateToCallback);
        }
        return this;
    },

    shiftTo: function(to, duration, mode, callback)
    {
        if(!duration)
            duration = 0;
        if(!mode)
            mode = AnimationMode.LINEAR;

        callback = callback || function(){};
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.offset.clone();
        let self = this;
        requestAnimationFrame(shiftToCallback);
        function shiftToCallback()
        {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            if(time >= endTime)
            {
                self.offset.set(to.x, to.y);
                self.update();
                callback();
                return;
            }

            self.offset = Vector2.interpolate(from, to, alpha, mode);
            self.update();
            requestAnimationFrame(shiftToCallback);
        }
        return this;
    },

    setMoveSpeed: function(speed)
    {
        this.maxMoveSpeed = speed;
        return this;
    },

    setRotateSpeed: function(speed)
    {
        this.maxTurnSpeed = speed;
        return this;
    },

    setMoveAcceleration: function(accel)
    {
        this.moveAccel = accel;
        return this;
    },

    setRotateAcceleration: function(accel)
    {
        this.turnAccel = accel;
        return this;
    },

    setZoomSpeed: function(speed)
    {
        this.maxZoomSpeed = speed;
        return this;
    },

    setZoomAcceleration: function(accel)
    {
        this.zoomAccel = accel;
        return this;
    },

    startShift: function(dir)
    {
        switch(dir.toLowerCase())
        {
        case "left":
            this.shiftVector.set(1, 0);
            break;
        case "right":
            this.shiftVector.set(-1, 0);
            break;
        case "up":
            this.shiftVector.set(0, -1);
            break;
        case "down":
            this.shiftVector.set(0, 1);
            break;
        default:
            this.shiftVector.set(0, 0);
            log("[WARNING] " + dir + " is an invalid direction in Camera.startShift().");
            return;
        }

        this.shifting = true;
        this.shiftTime  = Date.now();
        this.shiftSpeed = 0;
        let self = this;
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        requestAnimationFrame(function(){Camera.shiftCallback(self);});
        return this;
    },

    stopShift: function()
    {
        this.shifting = false;
        return this;
    },

    startZoom: function(dir)    // in: -1,  out: +1
    {
        this.zooming = true;
        this.zoomDir = dir;
        this.zoomSpeed = 0;
        this.zoomTime = Date.now();
        let self = this;
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        requestAnimationFrame(function(){Camera.zoomCallback(self);});
        return this;
    },

    startZoomIn: function()
    {
        this.zooming = true;
        this.zoomDir = -1;
        this.zoomSpeed = 0;
        this.zoomTime = Date.now();
        let self = this;
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        requestAnimationFrame(function(){Camera.zoomCallback(self);});
        return this;
    },

    startZoomOut: function()
    {
        this.zooming = true;
        this.zoomDir = 1;
        this.zoomSpeed = 0;
        this.zoomTime = Date.now();
        let self = this;
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        requestAnimationFrame(function(){Camera.zoomCallback(self);});
        return this;
    },

    stopZoom: function()
    {
        this.zooming = false;
        return this;
    },

    setPosition: function(x, y, z)
    {
        this.position.set(x, y, z);
        return this;
    },

    setTarget: function(x, y, z)
    {
        this.target.set(x, y, z);
        return this;
    },

    setOffset: function(x, y)
    {
        this.offset.set(x, y);
        return this;
    },

    setQuaternion: function(x, y, z, w)
    {
        this.quaternion.set(x, y, z, w);
        return this;
    },

    toString: function()
    {
        const FIXED = 100000;
        return "===== Camera =====\n" +
               "  Position: " + this.position + "\n" +
               "    Target: " + this.target + "\n" +
               "    Offset: " + this.offset + "\n" +
               "  Distance: " + Math.round(this.distance*FIXED)/FIXED + "\n" +
               "Quaternion: " + Math.round(this.quaternion*FIXED)/FIXED + "\n";
    }
};


///////////////////////////////////////////////////////////////////////////////
// callback for camera shifting animation
///////////////////////////////////////////////////////////////////////////////
Camera.shiftCallback = function(cam)
{
    let time = Date.now();
    let frameTime = (time - cam.shiftTime) * 0.001; // delta time per frame in sec
    cam.shiftTime = time; // for next frame
    cam.shiftSpeed = adjustSpeed(cam.shifting, cam.shiftSpeed, cam.maxMoveSpeed, cam.moveAccel, frameTime);

    cam.offset.x += frameTime * cam.shiftSpeed * cam.shiftVector.x;
    cam.offset.y += frameTime * cam.shiftSpeed * cam.shiftVector.y;

    cam.update();

    // loop
    if(cam.shifting || cam.shiftSpeed > 0)
    {
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        requestAnimationFrame(function(){Camera.shiftCallback(cam);});
    }
};



///////////////////////////////////////////////////////////////////////////////
// callback for camera zoom animation
///////////////////////////////////////////////////////////////////////////////
Camera.zoomCallback = function(cam)
{
    let time = Date.now();
    let frameTime = (time - cam.zoomTime) * 0.001;  // delta time per frame in sec
    cam.zoomTime = time;    // for next frame
    cam.zoomSpeed = adjustSpeed(cam.zooming, cam.zoomSpeed, cam.maxZoomSpeed, cam.zoomAccel, frameTime);

    cam.distance += frameTime * cam.zoomSpeed * cam.zoomDir;
    cam.update();

    // loop
    if(cam.zooming || cam.zoomSpeed > 0)
    {
        let requestAnimationFrame = getRequestAnimationFrameFunction(window);
        requestAnimationFrame(function(){Camera.zoomCallback(cam);});
    }

};
