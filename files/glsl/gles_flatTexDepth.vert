///////////////////////////////////////////////////////////////////////////////
// gles_flatTexDepth.vert
// ======================
// flat shading with depth texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2026-09-07
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;
attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixModelViewProjection;

// output varying variables
varying vec2 texCoord0;


void main(void)
{
    // pass texture coord
    texCoord0 = vertexTexCoord0;

    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);
}
