///////////////////////////////////////////////////////////////////////////////
// SelectBuffer.js
// ===============
// OpenGL selection buffer
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-02
// UPDATED: 2021-04-09
///////////////////////////////////////////////////////////////////////////////

let SelectBuffer = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[ERROR] SelectBuffer.contructor requires GL context as a param.");

    this.fbo = null;        // id of framebuffer object
    this.rbo = null;        // id of renderbuffer object for depth buffer
    this.tex = null;        // id of texture object for color buffer
    this.invalid = true;    // flag for redraw
};

SelectBuffer.prototype =
{
    init: function(width, height)
    {
        let gl = this.gl;

        // delete the previous buffer objects
        if(this.fbo) gl.deleteFramebuffer(this.fbo);
        if(this.rbo) gl.deleteRenderbuffer(this.rbo);
        if(this.tex) gl.deleteTexture(this.tex);

        this.invalid = true;
        this.fbo = gl.createFramebuffer();
        this.rbo = gl.createRenderbuffer();
        this.tex = gl.createTexture();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);

        // attach texture
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        } catch(e) {
            let texImage = new WebGLUnsignedByteArray(width * height * 4);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, texImage);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);

        // attach renderbuffer
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rbo);

        // check status
        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        let success = false;
        switch(status)
        {
        case gl.FRAMEBUFFER_COMPLETE:
            //log("SelectBuffer is initialized successfully.");
            success = true;
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            throw "SelectBuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            throw "SelectBuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            throw "SelectBuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            throw "SelectBuffer: FRAMEBUFFER_UNSUPPORTED";
            break;
        default:
            throw "SelectBuffer: " + status;
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return success;
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
    },

    clear: function()
    {
        this.bind();
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.unbind();
        return this;
    },

    pick: function(x, y)
    {
        this.bind();
        let color = new Uint8Array(4);
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, color);
        this.unbind();
        // convert color to index
        return color[0] + (color[1] << 8) + (color[2] << 16);
    },

    getColor: function(index)
    {
        let r = index & 0xFF;
        let g = index >> 8 & 0xFF;
        let b = index >> 16 & 0xFF;
        return new Float32Array([r/255, g/255, b/255, 1]);  // return as normalized
    }
};
