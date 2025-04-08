///////////////////////////////////////////////////////////////////////////////
// gles_floor.vert
// ===============
// 
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2012-02-09
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexCoord0;
//attribute vec2 vertexTexCoord1;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
//uniform mat4 matrixProjector;
uniform bool lightEnabled;
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
//@@varying vec4 texCoord1;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);

    // pass texture coord
    texCoord0 = vertexTexCoord0;
    //@@texCoord1 = matrixProjector * vec4(vertexPosition, 1);

    if(!lightEnabled)
    {
        diffuse = materialDiffuse;
        return;
    }

    ambient = materialAmbient;
    diffuse = materialDiffuse * lightColor;

    // directional
    if(lightPosition.w == 0.0)
    {
        lightVec = lightPosition.xyz;   // assume lightPosition is normalized
        lightDistance = -1.0;           // negative for directional
    }
    // positional
    else
    {
        // transform vertex pos to eye space
        vec4 eyeVertexVec = matrixModelView * vec4(vertexPosition, 1.0);

        // compute light vector and distance for positional
        lightVec = lightPosition.xyz - eyeVertexVec.xyz;
        lightDistance = length(lightVec);
        lightVec = normalize(lightVec);
    }

    // transform the normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    normalVec = matrixNormal * vec4(vertexNormal, 1.0);

    // compute half vector
    if(dot(lightVec.xyz, vec3(0.0, 0.0, 1.0)) > 0.0)
        halfVec = lightVec + vec3(0.0, 0.0, 1.0);
    else
        halfVec = vec3(0.0, 0.0, 0.0);
}
