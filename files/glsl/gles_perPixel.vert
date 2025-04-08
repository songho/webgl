///////////////////////////////////////////////////////////////////////////////
// gles_perPixel.vert
// ==================
// Per-Pixel lighting shader
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2012-10-01
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform vec4 lightPosition;             // should be on the eye space
uniform vec4 lightColor;
uniform vec3 lightAttenuations;         // constant, linear, quadratic attanuations
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    ambient = materialAmbient;
    diffuse = materialDiffuse * lightColor;

    // pass texture coord
    texCoord0 = vertexTexCoord0;

    // transform vertex position to eye space
    vec4 esPosition = matrixModelView * vec4(vertexPosition, ONE);

    // directional
    if(lightPosition.w == ZERO)
    {
        lightVec = lightPosition.xyz;   // assume lightPosition is normalized
        lightDistance = ZERO;           // 0 for directional light
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
    normalVec = matrixNormal * vec4(vertexNormal, ONE);

    // compute half vector
    vec4 viewVec = normalize(-esPosition); // vector from vertex to eye (camera) in eye space
    halfVec = lightVec + viewVec.xyz;
}
