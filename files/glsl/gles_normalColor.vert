///////////////////////////////////////////////////////////////////////////////
// gles_normalColor.vert
// =====================
// visualizing normal vectors as surface color
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2023-03-22
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

// uniforms
uniform mat4 matrixNormal;              // normal vector transform matrix
uniform mat4 matrixModelView;           // model-view matrix
uniform mat4 matrixModelViewProjection; // model-view-projection matrix

// varying variables
//varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal is already normalized.
    normalVec = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // transform vertex position from object space to eye space
    //positionVec = vec3(matrixModelView * vec4(vertexPosition, ONE));
}
