///////////////////////////////////////////////////////////////////////////////
// gles_postDefault.vert
// =====================
// post-processing: no effect
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-02
// UPDATED: 2017-08-14
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;
const float TWO  = 2.0;

// vertex attributes
attribute vec2 vertexPosition;  // (x, y)
attribute vec2 vertexTexCoord0;

// uniforms
uniform vec2 screenDimension;

// varying variables
varying vec2 texCoord0;                 // texture coords

void main(void)
{
    // texture coords
    texCoord0 = vertexTexCoord0;

    // normalized position [-1, 1]
    // assume viewport is set with full dimension (w x h)
    vec2 normPosition = (vertexPosition / screenDimension) * TWO - ONE;
    gl_Position = vec4(normPosition, ZERO, ONE);
}
