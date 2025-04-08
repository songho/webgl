///////////////////////////////////////////////////////////////////////////////
// gles_floorProj.vert
// ===================
// floor with projected texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2012-09-25
///////////////////////////////////////////////////////////////////////////////

// constants
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexCoord0;     // uv coord

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform mat4 matrixProjector;           // projector matrix
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
varying vec4 projCoord;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // pass texture coord
    texCoord0 = vertexTexCoord0;

    ambient = materialAmbient;
    diffuse = materialDiffuse * lightColor;

    // transform vertex position to eye space
    vec4 esPosition = matrixModelView * vec4(vertexPosition, ONE);

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
        //lightDistance = sqrt(dot(lightVec, lightVec));
        lightDistance = length(lightVec);
        lightVec = normalize(lightVec);
    }

    // transform the normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    normalVec = matrixNormal * vec4(vertexNormal, ONE);

    // compute half vector
    vec4 viewVec = normalize(-esPosition); // vector from vertex to eye (camera) in eye space
    halfVec = lightVec + viewVec.xyz;

    // uv for projector
    projCoord = matrixProjector * vec4(vertexPosition, ONE);
}
