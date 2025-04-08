///////////////////////////////////////////////////////////////////////////////
// gles_pointTex2d.vert
// ====================
// Shader for 2D points on screen with texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2017-08-02
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;
const float TWO  = 2.0;

// vertex attributes
attribute vec2 vertexPosition;  // (x, y)

// uniforms
uniform vec2 screenDimension;
uniform float pointSize;

void main(void)
{
    vec2 normPosition = (vertexPosition / screenDimension) * TWO - ONE; // -1 ~ 1
    gl_Position = vec4(normPosition, ZERO, ONE);
    gl_PointSize = pointSize;
}
