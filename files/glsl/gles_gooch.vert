///////////////////////////////////////////////////////////////////////////////
// gles_gooch.vert
// ===============
// Gooch shading
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2020-02-27
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

// uniforms
uniform mat4 matrixNormal;
//uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform vec4 lightPosition;             // should be in the eye space

// varying variables
varying vec3 normalVec;
varying vec3 lightVec;
varying vec3 viewVec;
//varying float lightDistance;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    normalVec = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // transform vertex position from object space to eye space
    vec3 esPosition = (matrixModelView * vec4(vertexPosition, ONE)).xyz;

     // compute vector from vertex to eye (camera) in eye space
    viewVec = normalize(-esPosition.xyz);

    // directional light
    if(lightPosition.w == ZERO)
    {
        lightVec = lightPosition.xyz;   // assume lightPosition is normalized
        //lightDistance = ZERO;           // 0 for directional light
    }
    // positional light
    else
    {
        // compute light vector and distance
        lightVec = lightPosition.xyz - esPosition;
        //lightDistance = length(lightVec);
        //lightVec = normalize(lightVec);
    }



}
