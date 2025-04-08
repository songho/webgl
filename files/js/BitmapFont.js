///////////////////////////////////////////////////////////////////////////////
// BitmapFont.js
// =============
// Bitmap font handler for AngelCode.com's Bitmap font Generator
// It requires OpenGL rendering context to construct.
// dependency: webglUtils.js
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-09
// UPDATED: 2024-07-01
///////////////////////////////////////////////////////////////////////////////

let BitmapQuad = new Float32Array(4 * 5); // a quad with vertex(3) and texCoords(2)



let BitmapCharacter = function()
{
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.xOffset = 0;
    this.yOffset = 0;
    this.xAdvance = 0;
    this.page = 0;
    this.s1 = 0;
    this.s2 = 1;
    this.t1 = 0;
    this.t2 = 1;
};



let BitmapFont = function(gl)
{
    this.gl = gl;
    if(!gl)
        log("[ERROR] BitmapFont.contructor requires GL context as a param.");

    this.height = 0;        // line height
    this.base = 0;
    this.bitmap = null;     // bitmap file name
    this.bitmapWidth = 0;
    this.bitmapHeight = 0;
    this.bitmapWidthInv = 1;
    this.bitmapHeightInv = 1;
    this.characterCount = 0;

    this.pages = [];
    this.characters = {};
    this.kernings = {};
    this.path = "";
    this.vbo = null;
    this.vbo2 = null;

    this.scale = [1, 1];
    this.matrix = new Matrix4();
    this.matrix.identity();
};

BitmapFont.prototype =
{
    loadFont: function(url)
    {
        // remember the path to load a bitmap
        this.path = url.substring(0, url.lastIndexOf("/")+1);

        // bitmap file name only
        this.bitmap = url.substring(url.lastIndexOf("/")+1);

        let self = this;
        loadFile(url).then(data =>
        {
            self.parse(data);
            self.setUvs(); // compute uvs per char
        });
        /*
        let str = loadFile(url);
        this.parse(str);
        this.setUvs(); // compute uvs per char
        //this.initQuads();
        */
    },

    parse: function(str)
    {
        // reset members
        for(let i = 0; i < this.pages.length; ++i)
            this.gl.deleteTexture(this.pages[i]);
        this.pages.length = 0;
        this.kernings = {};
        this.characters = {};

        // create vbo for drawText()
        if(!this.vbo)
            this.vbo = this.gl.createBuffer();

        let lines = str.split("\n");

        for(let i = 0, count = lines.length; i < count; ++i)
        {
            let fields = lines[i].split(" ");
            let field = fields.shift();

            if(field == "info")
            {
            //    this.parseInfo(fields);
            }
            else if(field == "common")
            {
                this.parseCommon(fields);
            }
            else if(field == "page")
            {
                this.parsePage(fields);
            }
            else if(field == "chars")
            {
                this.parseCharacterCount(fields);
            }
            else if(field == "char")
            {
                this.parseCharacter(fields);
            }
            else if(field == "kerning")
            {
                this.parseKerning(fields);
            }
        }
    },

    getKeyAndValue: function(str)
    {
        let keyValue = str.split("=");
        return {"key":keyValue[0], "value":keyValue[1]};
    },

    trimQuotes: function(str)
    {
        return str.substring(1, str.length-2);
    },

    parseCommon: function(fields)
    {
        for(let i = 0, count = fields.length; i < count; ++i)
        {
            let field = this.getKeyAndValue(fields[i]);

            if(field["key"] == "lineHeight")
            {
                this.height = parseInt(field["value"]);
            }
            else if(field["key"] == "base")
            {
                this.base = parseInt(field["value"]);
            }
            else if(field["key"] == "scaleW")
            {
                this.bitmapWidth = parseInt(field["value"]);
                this.bitmapWidthInv = 1 / this.bitmapWidth;
            }
            else if(field["key"] == "scaleH")
            {
                this.bitmapHeight = parseInt(field["value"]);
                this.bitmapHeightInv = 1 / this.bitmapHeight;
            }
        }
    },

    parsePage: function(fields)
    {
        for(let i = 0, count = fields.length; i < count; ++i)
        {
            let field = this.getKeyAndValue(fields[i]);
            if(field["key"] == "file")
            {
                let fileName = this.path + this.trimQuotes(field["value"]);
                let texId = loadTexture(this.gl, fileName, false);
                this.pages.push(texId);
            }
        }
    },

    parseCharacter: function(fields)
    {
        let index = null;

        for(let i = 0, count = fields.length; i < count; ++i)
        {
            let field = this.getKeyAndValue(fields[i]);
            if(field["key"] == "id")
            {
                index = parseInt(field["value"]);
                let character = new BitmapCharacter();
                this.characters[index] = character;
            }
            else if(field["key"] == "x")
            {
                this.characters[index].x = parseInt(field["value"]);
            }
            else if(field["key"] == "y")
            {
                this.characters[index].y = parseInt(field["value"]);
            }
            else if(field["key"] == "width")
            {
                this.characters[index].width = parseInt(field["value"]);
            }
            else if(field["key"] == "height")
            {
                this.characters[index].height = parseInt(field["value"]);
            }
            else if(field["key"] == "xoffset")
            {
                this.characters[index].xOffset = parseInt(field["value"]);
            }
            else if(field["key"] == "yoffset")
            {
                this.characters[index].yOffset = parseInt(field["value"]);
            }
            else if(field["key"] == "xadvance")
            {
                this.characters[index].xAdvance = parseInt(field["value"]);
            }
            else if(field["key"] == "page")
            {
                this.characters[index].page = parseInt(field["value"]);
            }
        }
    },

    parseCharacterCount: function(fields)
    {
        for(let i = 0, count = fields.length; i < count; ++i)
        {
            let field = this.getKeyAndValue(fields[i]);
            if(field["key"] == "count")
            {
                this.characterCount = parseInt(field["value"]);
            }
        }
    },

    parseKerning: function(fields)
    {
        let keypair = ""; // "1st-key|2nd-key"
        for(let i = 0, count = fields.length; i < count; ++i)
        {
            let field = this.getKeyAndValue(fields[i]);
            if(field["key"] == "first")
            {
                keypair = field["value"]; // first key
            }
            else if(field["key"] == "second")
            {
                keypair += "-" + field["value"]; // append the second key
            }
            else if(field["key"] == "amount")
            {
                this.kernings[keypair] = parseInt(field["value"]);
            }
        }
    },

    setUvs: function()
    {
        let chr;
        for(let key in this.characters)
        {
            chr = this.characters[key];
            chr.s1 = chr.x * this.bitmapWidthInv;
            chr.s2 = (chr.x + chr.width) * this.bitmapWidthInv;
            chr.t1 = chr.y * this.bitmapHeightInv;
            chr.t2 = (chr.y + chr.height) * this.bitmapHeightInv;
        }
    },

    /*
    initQuads: function()
    {
        // create vbo
        if(!this.vbo2)
            this.vbo2 = this.gl.createBuffer();

        //@@ FIXME: support max 256 chars
        let vertices = new Float32Array(4 * 5 * 256);

        let x1, x2, y1, y2;
        let chr;
        let i;
        for(let index in this.characters)
        {
            chr = this.characters[index];
            x1 = chr.xOffset * this.scale[0];
            x2 = x1 + chr.width * this.scale[0];
            y1 = (this.base - chr.yOffset) * this.scale[1];
            y2 = y1 - chr.height * this.scale[1];

            i = index * (5 * 4);
            vertices[i+0] = x1;     vertices[i+1] = y1;     vertices[i+2] = 0;
            vertices[i+3] = chr.s1; vertices[i+4] = chr.t1;

            vertices[i+5] = x1;     vertices[i+6] = y2;     vertices[i+7] = 0;
            vertices[i+8] = chr.s1; vertices[i+9] = chr.t2;

            vertices[i+10]= x2;     vertices[i+11]= y1;     vertices[i+12]= 0;
            vertices[i+13]= chr.s2; vertices[i+14]= chr.t1;

            vertices[i+15]= x2;     vertices[i+16]= y2;     vertices[i+17]= 0;
            vertices[i+18]= chr.s2; vertices[i+19]= chr.t2;

            // debug
            //log(index + ": " + vertices[i+0] + ", " + vertices[i+1] + ", " + vertices[i+2]);
            //log(index + ": " + vertices[i+5] + ", " + vertices[i+6] + ", " + vertices[i+7]);
            //log(index + ": " + vertices[i+10] + ", " + vertices[i+11] + ", " + vertices[i+12]);
            //log(index + ": " + vertices[i+15] + ", " + vertices[i+16] + ", " + vertices[i+17]);
            //log(index + ": " + vertices[i+3] + ", " + vertices[i+4]);   // s1, t1
            //log(index + ": " + vertices[i+18] + ", " + vertices[i+19]); // s2, t2
            //log();
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo2);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    },
    */

    /*
    ///////////////////////////////////////////////////////////////////////////
    // draw text by using pre-defined vbo
    ///////////////////////////////////////////////////////////////////////////
    drawText2: function(text, x, y, z)
    {
        let x1, x2, y1, y2; // left, right, top, bottom
        let dx;             // translation on x-axis
        let prevChar = 0;   // as decimal code
        let currChar = 0;   // as decimal code
        let keypair = "";

        //@@ FIXME: support only 1 page(texture)
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.pages[0]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo2);
        this.gl.vertexAttribPointer(this.gl.program.attribute.vertexPosition, 3, this.gl.FLOAT, false, 20, 0);
        this.gl.vertexAttribPointer(this.gl.program.attribute.vertexTexCoord0, 2, this.gl.FLOAT, false, 20, 12);

        let cursor = 0;
        for(let i = 0, count = text.length; i < count; ++i)
        {
            currChar = text.charCodeAt(i);
            keypair = "" + prevChar + "-" + currChar;
            cursor += this.kernings[keypair] || 0;

            dx = cursor * this.scale[0];
            this.matrix.setTranslation(x + dx, y, z);
            this.gl.uniformMatrix4fv(this.gl.program.uniform.matrixModel, false, this.matrix.m);

            //this.gl.activeTexture(this.gl.TEXTURE0);
            //this.gl.bindTexture(this.gl.TEXTURE_2D, this.pages[this.characters[currChar].page]);

            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 4 * currChar, 4);

            // next
            cursor += this.characters[currChar].xAdvance;
            prevChar = currChar;
        }
    },
    */

    ///////////////////////////////////////////////////////////////////////////
    // draw text by updating a vbo for each character dynamically
    ///////////////////////////////////////////////////////////////////////////
    drawText: function(text, x, y, z, centered)
    {
        let x1;         // left x
        let x2;         // right x
        let y1;         // top y
        let y2;         // bottom y
        let shiftX = 0;
        let shiftY = 0;
        let gl = this.gl;

        // skip if fnt file is not loaded yet
        if(this.pages.length == 0)
            return;

        if(centered)
        {
            shiftX = -this.getTextWidth(text) * 0.5;
            shiftY = -(this.height - this.base) * this.scale[1];
        }

        // position the text
        this.matrix.setTranslation(x, y, z);
        gl.uniformMatrix4fv(gl.program.uniform.matrixModel, false, this.matrix.m);

        let prevChar = 0;   // as decimal code
        let currChar = 0;   // as decimal code
        let keypair = "";
        let cursor = 0;
        for(let i = 0, count = text.length; i < count; ++i)
        {
            currChar = text.charCodeAt(i);
            keypair = "" + prevChar + "-" + currChar;
            cursor += this.kernings[keypair] || 0;

            let chr = this.characters[currChar];

            x1 = (cursor + chr.xOffset) * this.scale[0] + shiftX;
            x2 = x1 + (chr.width * this.scale[0]);
            y1 = (this.base - chr.yOffset) * this.scale[1] + shiftY;
            y2 = y1 - (chr.height * this.scale[1]);

            // interleaved triangle strip (vertex and texCoords)
            BitmapQuad[0] = x1;     BitmapQuad[1] = y1;     BitmapQuad[2] = 0;
            BitmapQuad[3] = chr.s1; BitmapQuad[4] = chr.t1;

            BitmapQuad[5] = x1;     BitmapQuad[6] = y2;     BitmapQuad[7] = 0;
            BitmapQuad[8] = chr.s1; BitmapQuad[9] = chr.t2;

            BitmapQuad[10]= x2;     BitmapQuad[11]= y1;     BitmapQuad[12]= 0;
            BitmapQuad[13]= chr.s2; BitmapQuad[14]= chr.t1;

            BitmapQuad[15]= x2;     BitmapQuad[16]= y2;     BitmapQuad[17]= 0;
            BitmapQuad[18]= chr.s2; BitmapQuad[19]= chr.t2;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.pages[chr.page]);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, BitmapQuad, gl.STATIC_DRAW);
            gl.vertexAttribPointer(gl.program.attribute.vertexPosition, 3, gl.FLOAT, false, 20, 0);
            gl.vertexAttribPointer(gl.program.attribute.vertexTexCoord0, 2, gl.FLOAT, false, 20, 12);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // next
            cursor += this.characters[currChar].xAdvance;
            prevChar = currChar;
        }
        return this;
    },

    getTextWidth: function(text)
    {
        let prevChar = 0;   // as decimal code
        let currChar = 0;   // as decimal code
        let keypair = "";
        let cursor = 0;

        // skip if fnt file is not loaded yet
        if(this.pages.length == 0)
            return;

        for(let i = 0, count = text.length; i < count; ++i)
        {
            currChar = text.charCodeAt(i);
            keypair = "" + prevChar + "-" + currChar;
            cursor += this.kernings[keypair] || 0;

            // next
            cursor += this.characters[currChar].xAdvance;
            prevChar = currChar;
        }

        return (cursor * this.scale[0]); // scale x
    },

    setScale: function(x, y)
    {
        this.scale[0] = x;
        this.scale[1] = y;
        return this;
    },

    toString: function()
    {
        return "===== BitmapFont =====\n" +
               "         Bitmap: " + this.bitmap + "\n" +
               "    Bitmap Size: " + this.bitmapWidth + " x " + this.bitmapHeight + "\n" +
               "    Line Height: " + this.height + "\n" +
               "           Base: " + this.base + "\n" +
               "Character Count: " + this.characterCount + "\n";
    }
};

