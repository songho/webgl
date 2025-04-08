///////////////////////////////////////////////////////////////////////////////
// gles_perFragmentLighting.vert
// =============================
// per-fragment lighting with a single light source
//
//  AUTHOR: Song Ho Ahn (songh.ahn@gmail.com)
// CREATED: 2011-02-23
// UPDATED: 2011-02-23
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec4 vertexColor;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform bool lightEnabled;
uniform vec4 lightPosition;             // should be on the eye space
uniform vec4 lightColor;
uniform vec3 lightAttenuations;         // constant, linear, quadratic attanuations
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);

    if(!lightEnabled)
    {
        ambient = vec4(0);
        diffuse = vertexColor;
        return;
    }

    ambient = materialAmbient;
    diffuse = vertexColor * lightColor;

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
    halfVec = normalize(lightVec + vec3(0,0,1));
}
