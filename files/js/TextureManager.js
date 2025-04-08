///////////////////////////////////////////////////////////////////////////////
// TextureManager.js
// =================
// OpenGL texture container
// dependency: TextureType
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-07-25
// UPDATED: 2021-11-02
///////////////////////////////////////////////////////////////////////////////

let TextureManager = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[ERROR] TextureManager.contructor requires GL context as a param.");

    this.textures = {}; // associative array
    this.count = 0;

    // load default textures
    this.defaultImage = this.createDefaultImage();
    this.defaultNormalmap = this.createDefaultNormalmap();
    this.defaultOcclusionmap = this.createDefaultOcclusionmap();
};

TextureManager.prototype =
{
    ///////////////////////////////////////////////////////////////////////////
    // load a texture from disk
    // it returns the OpenGL texture object
    // if url is invalid, return default texture
    ///////////////////////////////////////////////////////////////////////////
    load: function(url, repeat, type, callback)
    {
        // prepare a texture holder
        let texture = null;

        // get filename from url
        let key = url.substring(url.lastIndexOf("/")+1);

        // if invalid url return default texture
        if(!key)
        {
            if(type == TextureType.NORMALMAP)
                texture = this.textures["defaultNormalmap"];
            else if(type == TextureType.OCCLUSIONMAP)
                texture = this.textures["defaultOcclusionmap"];
            else
                texture = this.textures["defaultImage"];

            if(callback)
                callback(texture);
            return texture;
        }

        // if already exists, skip loading
        if(key in this.textures)
        {
            texture = this.textures[key];
            if(callback)
                callback(texture);
            return texture;
        }

        // use default image temporary
        let image = this.defaultImage;
        if(type == TextureType.NORMALMAP)
            image = this.defaultNormalmap;
        else if(type == TextureType.OCCLUSIONMAP)
            image = this.defaultOcclusionmap;

        // prepare a holder here
        texture = this.gl.createTexture();
        this.setupTexture(texture, image, repeat, type);
        this.textures[key] = texture;
        this.count++;

        // create an OpenGL texture object and a DOM image object
        image = new Image();
        image.crossOrigin = "anonymous";    // CORS

        // register events for async load
        let self = this;
        image.onload = function()
        {
            self.setupTexture(texture, image, repeat, type);
            //log("Loaded a texture: " + key);
            if(callback)
                callback(texture);
        };
        image.onerror = function()
        {
            // use default texture instead if failed to load
            if(type == TextureType.NORMALMAP)
                texture = self.textures["defaultNormalmap"];
            else if(type == TextureType.NORMALMAP)
                texture = self.textures["defaultOcclusionmap"];
            else
                texture = self.textures["defaultImage"];
            //throw new Error("[ERROR] Failed to load a texture " + key);
            //log("[ERROR] Failed to load a texture " + key);
            if(callback)
                callback(texture);
        }

        // set source of the image, so it can start to load
        image.src = url;

        return texture;
    },

    ///////////////////////////////////////////////////////////////////////////
    // copy bitmap data to OpenGL texture object
    ///////////////////////////////////////////////////////////////////////////
    setupTexture: function(texture, image, repeat, type)
    {
        let gl = this.gl;
        let format = gl.RGBA;
        if(type == TextureType.OCCLUSIONMAP)
            format = gl.LUMINANCE;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        if(repeat)
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
    },

    ///////////////////////////////////////////////////////////////////////////
    // create default image object
    ///////////////////////////////////////////////////////////////////////////
    createDefaultImage: function()
    {
        // default texture (white) with data:URI
        let defaultImageSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB" +
                              "AAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsTAAALEwEAmpwYAA" +
                              "AAB3RJTUUH3QsSDzYcefWBUwAAAB1pVFh0Q29tbWVudAAAAA" +
                              "AAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAGklEQVQoz2P8//" +
                              "8/AymAiYFEMKphVMPQ0QAAVW0DHZ8uFaIAAAAASUVORK5CYII=";
        /*
        // default texture (checker) with data:URI
        let defaultImageSrc = "data:image/png;base64," +
                              "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJ" +
                              "TUUH3AcaESgOg61X9QAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAKklE" +
                              "QVQoz2NkQAL///+HsxkZGbGKMzGQCGivgZEYdyOLD0Y/jMbDoPADADRQGBc8rkYKAAAAAElFTkSuQmCC";
        */
        this.textures["defaultImage"] = this.gl.createTexture();
        this.count++;
        let self = this;
        let defaultImage = new Image();
        defaultImage.src = defaultImageSrc;
        defaultImage.onload = function()
        {
            self.setupTexture(self.textures["defaultImage"], defaultImage, true);
        };
        return defaultImage;
    },

    ///////////////////////////////////////////////////////////////////////////
    // create default normalmap image object
    ///////////////////////////////////////////////////////////////////////////
    createDefaultNormalmap: function()
    {
        // default texture (blue) with data:URI
        let normalmapSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAA" +
                           "AAQCAIAAACQkWg2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJ" +
                           "TUUH4AYYDSMuqtrSDwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXR" +
                           "lZCB3aXRoIEdJTVBkLmUHAAAAGklEQVQoz2Osr//PQApgYiARjG" +
                           "oY1TB0NAAARsACHZTLr4oAAAAASUVORK5CYII=";

        this.textures["defaultNormalmap"] = this.gl.createTexture();
        this.count++;
        let self = this;
        let defaultNormalmap = new Image();
        defaultNormalmap.src = normalmapSrc;
        defaultNormalmap.onload = function()
        {
            self.setupTexture(self.textures["defaultNormalmap"], defaultNormalmap, true);
        };
        return defaultNormalmap;
    },

    ///////////////////////////////////////////////////////////////////////////
    // create default AO image object
    ///////////////////////////////////////////////////////////////////////////
    createDefaultOcclusionmap: function()
    {
        // default texture (max intensity) with data:URI
        let occlusionmapSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAA" +
                              "AAICAAAAADhZOFXAAAACXBIWXMAAAsSAAALEgHS3X78AAAAGXRF" +
                              "WHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAABBJREF" +
                              "UCNdj/M8AAUwMFDEASUEBD7IJnWIAAAAASUVORK5CYII=";

        this.textures["defaultOcclusionmap"] = this.gl.createTexture();
        this.count++;
        let self = this;
        let defaultOcclusionmap = new Image();
        defaultOcclusionmap.src = occlusionmapSrc;
        defaultOcclusionmap.onload = function()
        {
            self.setupTexture(self.textures["defaultOcclusionmap"], defaultOcclusionmap, true, TextureType.OCCLUSIONMAP);
        };
        return defaultOcclusionmap;
    },

    ///////////////////////////////////////////////////////////////////////////
    // return texture object
    ///////////////////////////////////////////////////////////////////////////
    get: function(key)
    {
        return this.textures[key];
    },

    getIndexOf: function(index)
    {
        let i = 0;
        let key;
        for(key in this.textures)
        {
            if(i == index)
                break;
            ++i;
        }
        if(i < this.count)
            return this.textures[key];
        else
            return this.textures["defaultImage"];
        return str;
    },

    ///////////////////////////////////////////////////////////////////////////
    // return array of texture names
    ///////////////////////////////////////////////////////////////////////////
    getTextureNames: function()
    {
        let names = [];
        for(key in this.textures)
            names.push(key);
        return names;
    },

    ///////////////////////////////////////////////////////////////////////
    // print itself
    toString: function()
    {
        let str = "===== Texture Manager =====\n";
        str += "Texture Count: " + this.count + "\n";
        let index = 0;
        for(let key in this.textures)
        {
            str += index++ + ": " + key + "\n";
        }
        return str;
    }
};
