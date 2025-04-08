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
const int   MAX_LIGHTS = 8;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
//attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform vec4 lightPositions[MAX_LIGHTS];

// varying variables
varying vec3 positionVec;   // vertex position in eye space
varying vec3 normalVec;
varying vec3 viewVec;
//varying vec2 texCoord0;
varying vec3 lightVecs[MAX_LIGHTS];
varying float lightDistances[MAX_LIGHTS];

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal is already normalized.
    normalVec = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // transform vertex position from object space to eye space
    vec4 esPosition = matrixModelView * vec4(vertexPosition, ONE);
    positionVec = esPosition.xyz; // pass vertex position in eye-space to fragment shader

     // compute vector from vertex to eye (camera) in eye space
    viewVec = normalize(-esPosition.xyz);

    // pass texture coord
    //texCoord0 = vertexTexCoord0;

    // compute light vector (from vertex to light) and distance
    // assume light position is defined in eye space
    vec3 light;
    float attenuation;
    for(int i = 0; i < MAX_LIGHTS; i++)
    {
        if(lightPositions[i].w == ZERO)
        {
            lightVecs[i] = lightPositions[i].xyz;   // assume lightPosition is normalized
            lightDistances[i] = ZERO;               // 1 for directional light
        }
        else
        {
            lightVecs[i] = lightPositions[i].xyz - positionVec;
            lightDistances[i] = sqrt(dot(lightVecs[i], lightVecs[i]));
            lightVecs[i] = normalize(lightVecs[i]);
        }
    }
}
