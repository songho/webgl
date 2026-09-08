///////////////////////////////////////////////////////////////////////////////
// FrameBuffer.js
// ==============
// class for OpenGL Frame Buffer Object (FBO)
// It requires OpenGL RC to construct and v2.0 for depth texture.
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-19
// UPDATED: 2026-09-07
///////////////////////////////////////////////////////////////////////////////

let FrameBuffer = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[ERROR] FrameBuffer.contructor requires GL context as a param.");

    this.fbo = null;        // id of framebuffer object
    this.rbo = null;        // id of renderbuffer object for depth buffer
    this.tex = null;        // id of texture object for color buffer
    this.depth = null;      // id of texture object for depth buffer (v2.0)
    this.invalid = true;    // flag for redraw
    this.width = 0;
    this.height = 0;
    this.depthBits = parseInt(gl.getParameter(gl.DEPTH_BITS));
};

FrameBuffer.prototype =
{
    init: function(width, height)
    {
        let gl = this.gl;

        // delete the previous buffer objects
        if(this.fbo) gl.deleteFramebuffer(this.fbo);
        if(this.rbo) gl.deleteRenderbuffer(this.rbo);
        if(this.tex) gl.deleteTexture(this.tex);
        if(this.depth) gl.deleteTexture(this.depth);

        this.invalid = true;
        this.width = width;
        this.height = height;

        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

        // attach color buffer
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        } catch(e) {
            let texImage = new WebGLUnsignedByteArray(width * height * 4);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, texImage);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);

        // attach depth buffer
        if(this.depthBits == 16)
        {
            this.rbo = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rbo);
        }
        else
        {
            this.depth = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.depth);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null); // must be integer type (not float)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth, 0);
        }
        
        // check status
        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch(status)
        {
        case gl.FRAMEBUFFER_COMPLETE:
            log("FrameBuffer is initialized successfully: (" + this.width + ", " + this.height + ").");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            throw "FrameBuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            throw "FrameBuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            throw "FrameBuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            throw "FrameBuffer: FRAMEBUFFER_UNSUPPORTED";
            break;
        default:
            throw "FrameBuffer: " + status;
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return this;
    },

    bind: function()
    {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
        return this;
    },

    unbind: function()
    {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return this;
    }
};
