///////////////////////////////////////////////////////////////////////////////
// gles_shadowTex.vert
// ===================
// generate shadow only texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2026-09-07
///////////////////////////////////////////////////////////////////////////////

// input vertex attributes
attribute vec3 vertexPosition;      // vertex position
attribute vec3 vertexNormal;        // vertex normal
attribute vec2 vertexTexCoord0;     // vertex tex coord

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform mat4 matrixShadowMap;           // projection matrix from light position
uniform vec4 lightPosition;             // should be in the eye space
uniform vec4 lightColor;
uniform vec3 lightAttenuations;         // constant, linear, quadratic attanuations
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent

// output varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;
varying vec4 shadowCoord;
varying vec4 esPosition;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);

    // pass texture coord
    texCoord0 = vertexTexCoord0;

    ambient = materialAmbient;
    diffuse = materialDiffuse * lightColor;

    // transform vertex position to eye space
    esPosition = matrixModelView * vec4(vertexPosition, 1.0);

    // directional
    if(lightPosition.w == 0.0)
    {
        lightVec = lightPosition.xyz;   // assume lightPosition is normalized
        lightDistance = 0.0;            // zero for directional
    }
    // positional
    else
    {
        // compute light vector and distance for positional
        lightVec = lightPosition.xyz - esPosition.xyz;
        lightDistance = length(lightVec);
        lightVec = normalize(lightVec);
    }

    // transform the normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    normalVec = matrixNormal * vec4(vertexNormal, 1.0);

    // compute half vector
    vec4 viewVec = normalize(-esPosition); // vector from vertex to eye (camera) in eye space
    halfVec = lightVec + viewVec.xyz;

    // vertex position in light space
    shadowCoord = matrixShadowMap * vec4(vertexPosition, 1.0);
}
