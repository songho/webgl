///////////////////////////////////////////////////////////////////////////////
// gles_blinnTexShadow.vert
// ========================
// Per-Pixel lighting shader with 1 texture and 1 shadowmap
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixModel                  vertexPosition          esPosition
// matrixNormal                 vertexNormal            esNormal
// matrixModelView              vertexTexCoord0         texCoord0
// matrixModelViewProjection                            lsPosition
// matrixShadowMap
// lightPosition
// lightColor
// lightAttenuation
// depthOffset
// shadowDimension
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
// map1
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2026-10-03
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixModel;               // model matrix
uniform mat4 matrixNormal;              // normal vector transform matrix
uniform mat4 matrixModelView;           // model-view matrix
uniform mat4 matrixModelViewProjection; // model-view-projection matrix
uniform mat4 matrixShadowMap;           // normalized projection matrix from light

// varying variables
varying vec3 esPosition;                // vertex position in eye space
varying vec3 esNormal;                  // normal vector in eye space
varying vec2 texCoord0;                 // texture coords
varying vec4 lsPosition;                // vertex position in light space

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal is already normalized.
    esNormal = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // transform vertex position from object space to eye space
    esPosition = vec3(matrixModelView * vec4(vertexPosition, ONE));

    // transform vertex position from world space to light space, [0, 1]
    vec4 wsPosition = matrixModel * vec4(vertexPosition, ONE);
    lsPosition = matrixShadowMap * wsPosition;

    // pass texture coord
    texCoord0 = vertexTexCoord0;
}
