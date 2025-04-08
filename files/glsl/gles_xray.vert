///////////////////////////////////////////////////////////////////////////////
// gles_xray.vert
// ==============
// x-ray rendering
// (Referenced from AMD/ATI ASHLI)
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-15
// UPDATED: 2012-10-01
///////////////////////////////////////////////////////////////////////////////

// constants
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform vec4 xrayColor;

// varying variables
varying vec4 eyeVec;
varying vec4 normalVec;
varying vec4 color;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    normalVec = matrixNormal * vec4(vertexNormal, ONE);

    // transform vertex position in eye space
    eyeVec = matrixModelView * vec4(vertexPosition, ONE);

    // pass vertex color
    color = xrayColor;
}
