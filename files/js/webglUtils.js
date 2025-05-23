///////////////////////////////////////////////////////////////////////////////
// webglUtils.js
// =============
// collection of WebGL utility functions.
// Most functions are required WebGL rendering context as a input param.
//
// This file depends on:
// Logger.js
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-03-01
// UPDATED: 2025-05-14
///////////////////////////////////////////////////////////////////////////////

// default 1x1 texture data
let defaultTextureData = new Uint8Array([255,255,255,255]);     // white
let defaultNormalmapData = new Uint8Array([127,127,255,255]);   // vertical normal
let defaultOcclusionmapData = new Uint8Array([255]);            // max luminance

let TextureType = { TEXTURE:0, NORMALMAP:1, OCCLUSIONMAP:2, CUBEMAP:3 };



///////////////////////////////////////////////////////////////////////////////
// check if WebGL supported by client browser
///////////////////////////////////////////////////////////////////////////////
function isWebGLSupported()
{
    if(window.WebGLRenderingContext)
        return true;
    else
        return false;
}



///////////////////////////////////////////////////////////////////////////////
// return WebGL rendering context if available
///////////////////////////////////////////////////////////////////////////////
function getContextGL(canvas)
{
    let context = null;
    let names = ["webgl2", "webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
    for(i = 0; i < names.length; ++i)
    {
        try{

        context = canvas.getContext(names[i]);
        if(context)
            break;

        }catch(e){}
    }
    if(!context)
    {
        log("[ERROR] Failed to get WebGL rendering context.");
        alert("[ERROR] Failed to get WebGL context.");
    }
    return context;
}



///////////////////////////////////////////////////////////////////////////////
// get requestAnimationFrame method for client browser
// If requestAnimationFrame() is implemented by the browser, use it to
// refresh the animations. Otherwise, use setTimeOut() with 16 ms interval.
///////////////////////////////////////////////////////////////////////////////
function getRequestAnimationFrameFunction(element)
{
    let names = ["requestAnimationFrame",
                 "mozRequestAnimationFrame",
                 "msRequestAnimationFrame",
                 "oRequestAnimationFrame",
                 "webkitRequestAnimationFrame"];
    let functionName = getAvailableFunctionFromList(element, names);
    if(functionName)
        return function(callback) { return element[functionName](callback); };
    else
        return function(callback) { return setTimeout(callback, 16); }; // 60 fps
}



///////////////////////////////////////////////////////////////////////////////
// get cancelAnimationFrame method for client browser
// If cancelAnimationFrame() is implemented by the browser, use it to
// refresh the animations. Otherwise, use clearTimeOut().
///////////////////////////////////////////////////////////////////////////////
function getCancelAnimationFrameFunction(element)
{
    let names = ["cancelAnimationFrame",
                 "mozCancelAnimationFrame",
                 "msCancelAnimationFrame",
                 "oCancelAnimationFrame",
                 "webkitCancelAnimationFrame"];
    let functionName = getAvailableFunctionFromList(element, names);
    if(functionName)
        return function(idx) { return element[functionName](idx); };
    else
        return function(idx) { return clearTimeout(idx); };
};



///////////////////////////////////////////////////////////////////////////////
// get animationStartTime method for client browser
// Use "animationStartTime" property, if possible, to sync other animations.
///////////////////////////////////////////////////////////////////////////////
function getAnimationStartTimeFunction(element)
{
    let names = ["animationStartTime",
                 "mozAnimationStartTime",
                 "msAnimationStartTime",
                 "oAnimationStartTime",
                 "webkitAnimationStartTime"];
    let functionName = getAvailableFunctionFromList(element, names);
    if(functionName)
        return function(){ return element[functionName]; };
    else
        return function() { return Date.now(); };
}



///////////////////////////////////////////////////////////////////////////////
// find available function from given list
// if not, return null
///////////////////////////////////////////////////////////////////////////////
function getAvailableFunctionFromList(element, names)
{
    if(!element) return null;

    for(let i = 0, count = names.length; i < count; ++i)
    {
        let name = names[i];
        if(element[name])   // if function exists, return the function name as string
            return name;
    }
    return null;            // if not found, return null
}



///////////////////////////////////////////////////////////////////////////////
// read shader source and compile it
// return OpenGL shader object
///////////////////////////////////////////////////////////////////////////////
function loadShaderById(gl, id)
{
    let shaderNode = document.getElementById(id);
    if(!shaderNode)
    {
        log("[WARNING] Cannot load GLSL shader source. The source ID is NULL.");
        return null;
    }

    // read shader source
    let source = "";
    let childNode = shaderNode.firstChild;
    while(childNode)
    {
        if(childNode.nodeType == 3) // is it "TEXT_NODE"
            source += childNode.textContent;
        childNode = childNode.nextSibling;
    }

    // create OpenGL shader
    let shader;
    if(shaderNode.type == "x-shader/x-vertex")
        shader = gl.createShader(gl.VERTEX_SHADER);
    else if(shaderNode.type == "x-shader/x-fragment")
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    else
      return null;

    // attach shader source to the shader and compile
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        //alert(gl.getShaderInfoLog(shader));
        log("[ERROR] " + gl.getShaderInfoLog(shader));
        return null;
    }

    log("Compiled GLSL shader, " + id + ".");
    return shader;
}



///////////////////////////////////////////////////////////////////////////////
// create a OpenGL shader program with vertex and fragment shader files
// It returns promise object with the GLSL shader program
///////////////////////////////////////////////////////////////////////////////
function createShaderProgram(gl, vertFile, fragFile)
{
    // return promise object
    let files = [vertFile, fragFile];
    return Promise.all(files.map(loadFile)).then(sources =>
    {
        // create OpenGL shader
        let vertShader = gl.createShader(gl.VERTEX_SHADER);
        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        // attach shader source to the shader and compile
        gl.shaderSource(vertShader, sources[0]);
        gl.compileShader(vertShader);
        if(!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS))
        {
            log("[ERROR] Vetex Shader: " + gl.getShaderInfoLog(vertShader));
            return null;
        }
        gl.shaderSource(fragShader, sources[1]);
        gl.compileShader(fragShader);
        if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS))
        {
            log("[ERROR] Fragment Shader: " + gl.getShaderInfoLog(fragShader));
            return null;
        }

        // create a program object and attach shader objects to it
        let program = gl.createProgram();
        program.uniform = {};
        program.attribute = {};
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);

        // link
        gl.linkProgram(program);
        if(!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            log("[ERROR] Failed to link GLSL: " + gl.getProgramInfoLog(program));
            return null;
        }

        addUniformLocations(gl, program);
        addAttributeLocations(gl, program);

        return program;
    });
}



///////////////////////////////////////////////////////////////////////////////
// get active uniform locations and store them to "program.uniform"
// The locations can be accessed later using object notations.
///////////////////////////////////////////////////////////////////////////////
function addUniformLocations(gl, program)
{
    let i;
    let count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(i = 0; i < count; ++i)
    {
        let info = gl.getActiveUniform(program, i); // return WebGLActiveInfo (name, type, size)
        let structName;
        let memberName;
        let dotPos = info.name.indexOf(".");
        let arrayName;
        let subscriptPos = info.name.indexOf("[");  // to detect array

        if(dotPos >= 0) // it is struct var
        {
            structName = info.name.substring(0, dotPos);
            memberName = info.name.substring(dotPos+1);
            if(program.uniform[structName] === undefined)
                program.uniform[structName] = {};
            program.uniform[structName][memberName] = gl.getUniformLocation(program, info.name);
            //log(info.name + " = " + program.uniform[structName][memberName]);
            //log("struct: " + program.uniform.pointLight.position);
        }
        else if(subscriptPos >= 0) // it is an array var
        {
            arrayName = info.name.substring(0, subscriptPos);
            program.uniform[arrayName] = gl.getUniformLocation(program, arrayName);
            //log(program.uniform[arrayName]);

            // first element is returned by getActiveUniform()
            program.uniform[arrayName][0] = gl.getUniformLocation(program, info.name);
            let j = 1;  // start from second index
            let loopFlag = true;
            while(loopFlag) // loop until the location is null
            {
                memberName = arrayName + "[" + j + "]";
                program.uniform[arrayName][j] = gl.getUniformLocation(program, memberName);
                //log(j + ": " + program.uniform[arrayName][j]);
                if(!program.uniform[arrayName][j])
                    loopFlag = false;

                ++j; // next
            }
        }
        else
        {
            //program["u_"+info.name] = gl.getUniformLocation(program, info.name);
            program.uniform[info.name] = gl.getUniformLocation(program, info.name);
        }
        //log("UNIFORM: " + info.name + " = " + program.uniform[info.name]);
    }
}



///////////////////////////////////////////////////////////////////////////////
// get active attribute locations and store them to "program.attribute"
// The locations can be accessed later using object notations.
///////////////////////////////////////////////////////////////////////////////
function addAttributeLocations(gl, program)
{
    // add attributes locations
    let count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(let i = 0; i < count; ++i)
    {
        let info = gl.getActiveAttrib(program, i); // return WebGLActiveInfo
        program.attribute[info.name] = gl.getAttribLocation(program, info.name);
        gl.enableVertexAttribArray(program.attribute[info.name]);
        //log("ATTRIBUTE: " + info.name + " = " + program.attribute[info.name]);
    }
}



///////////////////////////////////////////////////////////////////////////////
// assign all VAO vertexattrib arrays to dummy buffer
///////////////////////////////////////////////////////////////////////////////
function initVertexAttribArrays(gl)
{
    gl.dummyBuffer = new Float32Array([0,0,0,0]);
    gl.vboDummy = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vboDummy);
    gl.bufferData(gl.ARRAY_BUFFER, gl.dummyBuffer, gl.STATIC_DRAW);
    let attribCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    for(let i = 0; i < attribCount; ++i)
    {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 0, 0);
    }
}



///////////////////////////////////////////////////////////////////////////////
// return webgl data type enum value to string
///////////////////////////////////////////////////////////////////////////////
function dataTypeToString(type)
{
    switch(type)
    {
        case 0x1401: return "UNSIGNED_BYTE";
        case 0x1402: return "SHORT";
        case 0x1403: return "UNSIGNED_SHORT";
        case 0x1404: return "INT";
        case 0x1405: return "UNSIGNED_INT";
        case 0x1406: return "FLOAT";
        case 0x8B50: return "FLOAT_VEC2";
        case 0x8B51: return "FLOAT_VEC3";
        case 0x8B52: return "FLOAT_VEC4";
        case 0x8B53: return "INT_VEC2";
        case 0x8B54: return "INT_VEC3";
        case 0x8B55: return "INT_VEC4";
        case 0x8B56: return "BOOL";
        case 0x8B57: return "BOOL_VEC2";
        case 0x8B58: return "BOOL_VEC3";
        case 0x8B59: return "BOOL_VEC4";
        case 0x8B5A: return "FLOAT_MAT2";
        case 0x8B5B: return "FLOAT_MAT3";
        case 0x8B5C: return "FLOAT_MAT4";
        case 0x8B5E: return "SAMPLER_2D";
        case 0x8B60: return "SAMPLER_CUBE";
        default: return "Unknown type";
    }
}



///////////////////////////////////////////////////////////////////////////////
// load texture asynchronously, and return OpenGL texture object
///////////////////////////////////////////////////////////////////////////////
function loadTexture(gl, url, repeat, callback)
{
    // create an OpenGL texture object and a DOM image object
    let texture = gl.createTexture();
    setupDefaultTexture(gl, texture); // temporarily use default image until it is loaded

    // create new image and load it from URL
    let imageName = url.substring(url.lastIndexOf("/")+1);
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = function()
    {
        setupTexture(gl, texture, image, repeat);
        //texture.image = image; // replace it from default
        //log("url: " + image.src);

        log("Loaded texture: " + imageName);
        if(callback)
            callback(texture);
    };
    image.onerror = function()
    {
        log("[ERROR] Failed to load texture: " + imageName);
        if(callback)
            callback(null);
    };

    return texture;
}



///////////////////////////////////////////////////////////////////////////////
// load normalmap asynchronously, and return OpenGL texture object
///////////////////////////////////////////////////////////////////////////////
function loadNormalmap(gl, url, repeat, callback)
{
    // create an OpenGL texture object and a DOM image object
    let texture = gl.createTexture();
    setupDefaultTexture(gl, texture, TextureType.NORMALMAP);

    // create new image and load it from URL
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = function()
    {
        setupTexture(gl, texture, image, repeat);
        //texture.image = image; // replace it from default
        //log("url: " + image.src);

        if(callback)
            callback(texture);
        log("Loaded a normalmap: " + url.substring(url.lastIndexOf("/")+1));
    };
    image.onerror = function()
    {
        if(callback)
            callback(null);
        log("[ERROR] Failed to load a normalmap " + url.substring(url.lastIndexOf("/")+1));
    };

    return texture;
}



///////////////////////////////////////////////////////////////////////////////
// load AO map asynchronously, and return OpenGL texture object
///////////////////////////////////////////////////////////////////////////////
function loadOcclusionmap(gl, url, repeat, callback)
{
    // create an OpenGL texture object and a DOM image object
    let texture = gl.createTexture();
    setupDefaultTexture(gl, texture, TextureType.OCCLUSIONMAP);

    // create new image and load it from URL
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = function()
    {
        setupTexture(gl, texture, image, repeat, TextureType.OCCLUSIONMAP);
        //texture.image = image; // replace it from default
        //log("url: " + image.src);

        if(callback)
            callback(texture);
        log("Loaded a normalmap: " + url.substring(url.lastIndexOf("/")+1));
    };
    image.onerror = function()
    {
        if(callback)
            callback(null);
        log("[ERROR] Failed to load a normalmap " + url.substring(url.lastIndexOf("/")+1));
    };

    return texture;
}



///////////////////////////////////////////////////////////////////////////////
// load 6 cubemap textures by inserting number 0...6 right after the input file
// For example, if input is "image.bmp", it will load the following image files
// image0.bmp: GL_TEXTURE_CUBE_MAP_POSITIVE_X
// image1.bmp: GL_TEXTURE_CUBE_MAP_NEGATIVE_X
// image2.bmp: GL_TEXTURE_CUBE_MAP_POSITIVE_Y
// image3.bmp: GL_TEXTURE_CUBE_MAP_NEGATIVE_Y
// image4.bmp: GL_TEXTURE_CUBE_MAP_POSITIVE_Z
// image5.bmp: GL_TEXTURE_CUBE_MAP_NEGATIVE_Z
///////////////////////////////////////////////////////////////////////////////
function loadCubemap(gl, url, callback)
{
    let index = url.lastIndexOf(".");
    let fileName = url.substring(0, index);
    let fileExt = url.substring(index);     // with .

    // create an OpenGL texture object and a DOM image object
    let texture = gl.createTexture();
    setupDefaultTexture(gl, texture, TextureType.CUBEMAP);

    let loadedCount = 0;
    for(let i = 0; i < 6; ++i)
    {
        // create new image and load it from URL
        let path = fileName + i + fileExt;
        let image = new Image();
        image.src = path;
        image.crossOrigin = "anonymous";
        image.onload = function()
        {
            setupCubemap(gl, texture, image, i);
            if(callback)
                callback(texture, i);
            log("Loaded a cubemap: " + path.substring(path.lastIndexOf("/")+1));
            // mipmap generation
            if(++loadedCount >= 6)
            {
                log("Complete loading 6 cubemap images. Generating mipmaps for the cubemap: " + fileName.substring(path.lastIndexOf("/")+1));
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            }
        };
        image.onerror = function()
        {
            if(callback)
                callback(null, i);
            log("[ERROR] Failed to load a cubemap " + path.substring(path.lastIndexOf("/")+1));
        };
    }

    return texture;
}



///////////////////////////////////////////////////////////////////////////////
// copy image to OpenGL texture
///////////////////////////////////////////////////////////////////////////////
function setupTexture(gl, texture, image, repeat, type)
{
    let format = gl.RGBA;
    if(type == TextureType.OCCLUSIONMAP)
        format = gl.LUMINANCE;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    if(repeat == true)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}



///////////////////////////////////////////////////////////////////////////////
// copy a single cubemap to OpenGL texture with cubemap index
// index should be one of
// TEXTURE_CUBE_MAP_POSITIVE_X = 0, TEXTURE_CUBE_MAP_NEGATIVE_X = 1,
// TEXTURE_CUBE_MAP_POSITIVE_Y = 2, TEXTURE_CUBE_MAP_NEGATIVE_Y = 3,
// TEXTURE_CUBE_MAP_POSITIVE_Z = 4, TEXTURE_CUBE_MAP_NEGATIVE_Z = 5
///////////////////////////////////////////////////////////////////////////////
function setupCubemap(gl, texture, image, index)
{
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}



///////////////////////////////////////////////////////////////////////////////
// assign default 1x1 image data to the target texture object
// Types: 0=base, 1=normalmap, 2=occlusionmap, 3=cubemap
///////////////////////////////////////////////////////////////////////////////
function setupDefaultTexture(gl, texture, type)
{
    let format = gl.RGBA;
    let textureData = defaultTextureData;
    if(type == TextureType.NORMALMAP)
    {
        textureData = defaultNormalmapData;
    }
    else if(type == TextureType.OCCLUSIONMAP)
    {
        textureData = defaultOcclusionmapData;
        format = gl.LUMINANCE;
    }
    else if(type == TextureType.CUBEMAP)
    {
        // use cubemap specific target token
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for(let i = 0; i < 6; ++i)
        {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, 1, 1, 0, format, gl.UNSIGNED_BYTE, textureData);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return;
    }

    // use default 2D texture token
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, 1, 1, 0, format, gl.UNSIGNED_BYTE,
                  textureData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
}



///////////////////////////////////////////////////////////////////////////////
// load file as a string
// return promise object
///////////////////////////////////////////////////////////////////////////////
function loadFile(url)
{
    return new Promise((resolve, reject) =>
    {
        let fileName = url.substring(url.lastIndexOf("/")+1);
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        //xhr.responseType = "text";  // text, blob, document, arraybuffer...
        xhr.send();
        // add event for async
        xhr.onload = () =>
        {
            if(xhr.status == 200) // OK
            {
                resolve(xhr.response);
                log("Loaded file: " + fileName);
            }
            else
            {
                let errorMessage = "[ERROR] Failed to load file(" + xhr.status + "): " + fileName;
                reject(errorMessage);
                log(errorMessage);
            }
        };
        xhr.onerror = () => reject("[ERROR] Failed to load: " + fileName);
    });
}



///////////////////////////////////////////////////////////////////////////////
// recompute interpolate alpha value based on mode
///////////////////////////////////////////////////////////////////////////////
/* defined in AnimationModes.js
let AnimationMode = {
    LINEAR: 0,
    EASE_IN: 1,
    EASE_IN2: 2, // using circle
    EASE_OUT: 3,
    EASE_OUT2: 4, // using circle
    EASE_IN_OUT: 5,
    EASE_IN_OUT2: 6, // using circle
    BOUNCE: 7,
    ELASTIC: 8
};
*/
function getInterpolateAlpha(alpha, mode)
{
    //let HALF_PI = Math.PI * 0.5;
    let t = alpha;

    // recompute alpha based on animation mode
    if(mode == AnimationMode.EASE_IN)
    {
        //t = 1 - Math.cos(HALF_PI * alpha);
        t = alpha * alpha * alpha;
    }
    else if(mode == AnimationMode.EASE_IN2)
    {
        t = 1 - Math.sqrt(1 - alpha * alpha);
    }
    else if(mode == AnimationMode.EASE_OUT)
    {
        //t = Math.sin(HALF_PI * alpha);
        let beta = 1 - alpha;
        t = 1 - beta * beta * beta;
    }
    else if(mode == AnimationMode.EASE_OUT2)
    {
        t = Math.sqrt(1 - (1 - alpha) * (1 - alpha));
    }
    else if(mode == AnimationMode.EASE_IN_OUT)
    {
        //t = 0.5 * (1 - Math.cos(Math.PI * alpha));
        let beta = 1 - alpha;
        let scale = 4.0;     // 0.5 / (0.5^3)
        if(alpha < 0.5)
            t = alpha * alpha * alpha * scale;
        else
            t = 1 - (beta * beta * beta * scale);
    }
    else if(mode == AnimationMode.EASE_IN_OUT2)
    {
        if(alpha < 0.5)
            t = 0.5 * (1 - Math.sqrt(1 - alpha * alpha));
        else
            t = 0.5 * Math.sqrt(1 - (1 - alpha) * (1 - alpha)) + 0.5;
    }
    else if(mode == AnimationMode.BOUNCE)
    {
    }
    else if(mode == AnimationMode.ELASTIC)
    {
    }

    return t;
}



///////////////////////////////////////////////////////////////////////////////
// 1D interpolation
///////////////////////////////////////////////////////////////////////////////
function interpolate(from, to, alpha, mode)
{
    let t = getInterpolateAlpha(alpha, mode);
    return from +  (to - from) * t;
}



///////////////////////////////////////////////////////////////////////////////
// accelerate / deaccelerate speed
// === PARAMS ===
//  isMoving: accelerate if true, deaccelerate if false
// currSpeed: the current speed
//  maxSpeed: maximum speed (positive or negative)
//     accel: acceleration (always positive)
// deltaTime: frame time in second
///////////////////////////////////////////////////////////////////////////////
function adjustSpeed(isMoving, currSpeed, maxSpeed, accel, deltaTime)
{
    // determine direction
    let sign;
    if(maxSpeed > 0)
        sign = 1;
    else
        sign = -1;

    // accelerating
    if(isMoving)
    {
        currSpeed += sign * accel * deltaTime;
        if((sign * currSpeed) > (sign * maxSpeed))
            currSpeed = maxSpeed;
    }
    // deaccelerating
    else
    {
        currSpeed -= sign * accel * deltaTime;
        if((sign * currSpeed) < 0)
            currSpeed = 0;
    }

    return currSpeed;
}



///////////////////////////////////////////////////////////////////////////////
// slide an element to (left, top, width, height)
///////////////////////////////////////////////////////////////////////////////
function slideTo(id, left, top, width, height, duration, mode, callback)
{
    let element = document.getElementById(id);
    if(!element)
        return;

    callback = callback || function(){};

    let from = {};
    from.left = parseInt(element.style.left);
    from.top = parseInt(element.style.top);
    from.width = parseInt(element.style.width);
    from.height = parseInt(element.style.height);
    from.time = Date.now();

    let to = {}
    to.left = left;
    to.top = top;
    to.width = width;
    to.height = height;
    to.time = from.time + duration;

    requestAnimationFrame(slideToFrame);
    function slideToFrame()
    {
        let time = Date.now();
        if(time >= to.time)
        {
            element.style.left = to.left + "px";
            element.style.top = to.top + "px";
            element.style.width = to.width + "px";
            element.style.height = to.height + "px";
            clearInterval(animId);
            callback();
            return;
        }
        let alpha = (time - from.time) / duration;
        let left = Math.round(interpolate(from.left, to.left, alpha, mode));
        let top = Math.round(interpolate(from.top, to.top, alpha, mode));
        let width = Math.round(interpolate(from.width, to.width, alpha, mode));
        let height = Math.round(interpolate(from.height, to.height, alpha, mode));
        element.style.left = left + "px";
        element.style.top = top + "px";
        element.style.width = width + "px";
        element.style.height = height + "px";
        requestAnimationFrame(slideToFrame);
    }
}



///////////////////////////////////////////////////////////////////////////////
// convert radian to degree or vice versa
///////////////////////////////////////////////////////////////////////////////
function rad2deg(rad)
{
    return rad / Math.PI * 180;
}
function deg2rad(deg)
{
    return deg / 180 * Math.PI;
}



///////////////////////////////////////////////////////////////////////////////
// compute relative position if an element
///////////////////////////////////////////////////////////////////////////////
function getElementOffset(element)
{
    let x = 0;
    let y = 0;
    while(element)
    {
        x += element.offsetLeft || 0;
        y += element.offsetTop || 0;
        element = element.offsetParent; // next
    }

    return {x:x, y:y};
}



///////////////////////////////////////////////////////////////////////////////
// return the client width/height of window
///////////////////////////////////////////////////////////////////////////////
function getWindowWidth()
{
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
}
function getWindowHeight()
{
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
}



///////////////////////////////////////////////////////////////////////////////
// compute the volume of 3D geometry using shoelace formula
///////////////////////////////////////////////////////////////////////////////
function computeVolume(vertices, indices)
{
    let i1, i2, i3;
    let d1, d2, d3;
    let v1 = {}, v2 = {}, v3 = {};
    let sum = 0;
    for(let i = 0; i < indices.length; i += 3)
    {
        i1 = indices[i] * 3;
        v1.x = vertices[i1];
        v1.y = vertices[i1 + 1];
        v1.z = vertices[i1 + 2];

        i2 = indices[i + 1] * 3;
        v2.x = vertices[i2];
        v2.y = vertices[i2 + 1];
        v2.z = vertices[i2 + 2];

        i3 = indices[i + 2] * 3;
        v3.x = vertices[i3];
        v3.y = vertices[i3 + 1];
        v3.z = vertices[i3 + 2];

        d1 = v2.y*v3.z - v3.y*v2.z;
        d2 = v3.y*v1.z - v1.y*v3.z;
        d3 = v1.y*v2.z - v2.y*v1.z;

        sum += v1.x*d1 + v2.x*d2 + v3.x*d3;
    }
    return 1 / 6 * sum;
}



///////////////////////////////////////////////////////////////////////////////
// compute the surface area of 3D geometry
///////////////////////////////////////////////////////////////////////////////
function computeArea(vertices, indices)
{
    let i1, i2, i3;
    let v1 = {}, v2 = {}, v3 = {}, a = {}, b = {}, c = {};
    let sum = 0;
    for(let i = 0; i < indices.length; i += 3)
    {
        i1 = indices[i] * 3;
        v1.x = vertices[i1];
        v1.y = vertices[i1+1];
        v1.z = vertices[i1+2];

        i2 = indices[i+1] * 3;
        v2.x = vertices[i2];
        v2.y = vertices[i2+1];
        v2.z = vertices[i2+2];

        i3 = indices[i+2] * 3;
        v3.x = vertices[i3];
        v3.y = vertices[i3+1];
        v3.z = vertices[i3+2];

        // v2 - v1
        a.x = v2.x - v1.x;
        a.y = v2.y - v1.y;
        a.z = v2.z - v1.z;

        // v3 - v1
        b.x = v3.x - v1.x;
        b.y = v3.y - v1.y;
        b.z = v3.z - v1.z;

        // cross product
        c.x = a.y*b.z - b.y*a.z;
        c.y = a.z*b.x - b.z*a.x;
        c.z = a.x*b.y - b.x*a.y;

        sum += Math.sqrt(c.x*c.x + c.y*c.y + c.z*c.z);
    }
    return 1 / 2 * sum;
}



///////////////////////////////////////////////////////////////////////////////
// limit angle degree in range of (-180, 180], radian in (-pi, pi]
///////////////////////////////////////////////////////////////////////////////
function normalizeDegree(angle)
{
    let a = angle % 360;
    if(a > 180)        a -= 360;
    else if(a <= -180) a += 360;
    return a;
}
function normalizeRadian(angle)
{
    const PI2 = Math.PI * 2;
    let a = angle % PI2;
    if(a > Math.PI)        a -= PI2;
    else if(a <= -Math.PI) a += PI2;
    return a;
}



///////////////////////////////////////////////////////////////////////////////
// sample N times from an array of Float32Array elements
///////////////////////////////////////////////////////////////////////////////
function sampleVertices(vertices, n)
{
    // compute step
    let step = 1;
    let vertexCount = vertices.length / 3;
    if(vertexCount > n)
        step = Math.floor(vertexCount / n);
    else
        n = vertexCount;

    let samples = new Float32Array(n * 3);
    for(let i = 0; i < n; ++i)
    {
        let j = i * 3;
        let k = j * step;
        samples[j] = vertices[k];
        samples[j+1] = vertices[k+1];
        samples[j+2] = vertices[k+2];
    }
    return samples;
}



///////////////////////////////////////////////////////////////////////////////
// generate tangents for normalmap from vertices, normals and texture coords
///////////////////////////////////////////////////////////////////////////////
function generateTangents(vertices, normals, texCoords, indices)
{
    let tangents = new Float32Array(vertices.length);

    let count = indices.length;
    for(let i = 0; i < count; i += 3)
    {
        // edge vectors
        let vi1 = indices[i] * 3;
        let vi2 = indices[i + 1] * 3;
        let vi3 = indices[i + 2] * 3;
        let e1 = new Vector3(vertices[vi2] - vertices[vi1], vertices[vi2+1] - vertices[vi1+1], vertices[vi2+2] - vertices[vi1+2]);
        let e2 = new Vector3(vertices[vi3] - vertices[vi1], vertices[vi3+1] - vertices[vi1+1], vertices[vi3+2] - vertices[vi1+2]);

        // delta texcoords vectors
        let ti1 = indices[i] * 2;
        let ti2 = indices[i + 1] * 2;
        let ti3 = indices[i + 2] * 2;
        let d1 = new Vector2(texCoords[ti2] - texCoords[ti1], texCoords[ti2+1] - texCoords[ti1+1]);
        let d2 = new Vector2(texCoords[ti3] - texCoords[ti1], texCoords[ti3+1] - texCoords[ti1+1]);

        let id = 1 / (d1.x * d2.y - d1.y * d2.x);   // inverse determinent

        let t = new Vector3();
        t.x = id * (d2.y * e1.x - d1.y * e2.x);
        t.y = id * (d2.y * e1.y - d1.y * e2.y);
        t.z = id * (d2.y * e1.z - d1.y * e2.z);
        t.normalize(t);

        // make perpendicular to vertex normal: T - (T.N) * N
        let n1 = new Vector3(normals[vi1], normals[vi1+1], normals[vi1+2]);
        let n2 = new Vector3(normals[vi2], normals[vi2+1], normals[vi2+2]);
        let n3 = new Vector3(normals[vi3], normals[vi3+1], normals[vi3+2]);
        let t1 = t.clone().subtract(n1.clone().scale(t.dot(n1))).normalize();
        let t2 = t.clone().subtract(n2.clone().scale(t.dot(n2))).normalize();
        let t3 = t.clone().subtract(n3.clone().scale(t.dot(n3))).normalize();

        // copy
        tangents[vi1] = t1.x; tangents[vi1+1] = t1.y; tangents[vi1+2] = t1.z;
        tangents[vi2] = t2.x; tangents[vi2+1] = t2.y; tangents[vi2+2] = t2.z;
        tangents[vi3] = t3.x; tangents[vi3+1] = t3.y; tangents[vi3+2] = t3.z;
    }

    return tangents;
}
