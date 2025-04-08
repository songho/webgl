///////////////////////////////////////////////////////////////////////////////
// gles_phongTexBump.vert
// ======================
// Phong lighting shader with 1 texture & 1 normalmap
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection    vertexTexCoord0         texCoord0
// lightPosition                vertexTangent
// lightColor
// lightAttenuation
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
// map1
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2015-06-04
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexCoord0;
attribute vec3 vertexTangent;

// uniforms
uniform mat4 matrixNormal;              // normal vector transform matrix
uniform mat4 matrixModelView;           // model-view matrix
uniform mat4 matrixModelViewProjection; // model-view-projection matrix

// varying variables
varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space
varying vec2 texCoord0;                 // texture coords
varying vec3 tangentVec;                // tangent vector in eye space
varying vec3 binormalVec;               // binormal (bitangent) vector in eye space

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal is already normalized.
    normalVec = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // get tangent vector in eye space
    tangentVec = (matrixNormal * vec4(vertexTangent, ONE)).xyz;

    // compute binormal in eye space
    binormalVec = normalize(cross(normalVec, tangentVec));

    // transform vertex position from object space to eye space
    positionVec = vec3(matrixModelView * vec4(vertexPosition, ONE));

    // pass texture coord
    texCoord0 = vertexTexCoord0;
}
