///////////////////////////////////////////////////////////////////////////////
// gles_positionalLights.vert
// ==========================
// multiple positional lighting shader
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection                            viewVec
// lightPosition
// lightColor
// lightAttenuations
// lightCount
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2015-05-15
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
//attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;

// varying variables
varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space
//varying vec2 texCoord0;                 // texture coords

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal is already normalized.
    normalVec = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // transform vertex position from object space to eye space
    positionVec = vec3(matrixModelView * vec4(vertexPosition, ONE));

    // pass texture coord
    //texCoord0 = vertexTexCoord0;
}
