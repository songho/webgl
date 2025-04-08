///////////////////////////////////////////////////////////////////////////////
// gles_wireframe.vert
// ===================
// wireframe shading
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2016-09-25
// UPDATED: 2016-09-25
///////////////////////////////////////////////////////////////////////////////

const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexBarycentric;

// uniforms
uniform mat4 matrixModelViewProjection;

// varying vars
varying vec3 barycentricVec;        // barycentric coords

void main(void)
{
    barycentricVec = vertexBarycentric;

    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);
}
