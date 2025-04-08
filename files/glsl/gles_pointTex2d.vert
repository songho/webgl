///////////////////////////////////////////////////////////////////////////////
// gles_pointTex2d.vert
// ====================
// Shader for 2D points using ortho projection with texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2017-08-11
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec2 vertexPosition;  // (x, y)

// uniforms
uniform mat4 matrixModelViewProjection;
uniform float pointSize;

void main(void)
{
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ZERO, ONE);
    gl_PointSize = pointSize;
}
