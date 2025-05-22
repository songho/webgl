#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles_flatTex.vert
// =================
// flat shading with texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2017-08-18
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixModelViewProjection;

// varying variables
out vec2 texCoord0;                 // texture coords

void main(void)
{
    // pass texture coord
    texCoord0 = vertexTexCoord0;

    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);
}
