///////////////////////////////////////////////////////////////////////////////
// gles_phong.vert
// ===============
// Per-Pixel lighting shader (Bui-Tuong Phong lighting model)
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          normalVec
// matrixModelView              vertexNormal            positionVec
// matrixModelViewProjection
// lightPosition
// lightColor
// lightAttenuation
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2015-06-02
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
//attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixNormal;              // normal vector transform matrix
uniform mat4 matrixModelView;           // model-view matrix
uniform mat4 matrixModelViewProjection; // model-view-projection matrix
uniform vec4 lightPosition;             // should be in the eye space
uniform vec3 lightAttenuation;          // attenuation coefficients (k0, k1, k2)

// varying variables
varying vec3 normalVec;                 // normal vector in eye space
varying vec3 positionVec;               // vertex position in eye space
varying vec3 viewVec;                   // view vector in eye space
varying vec3 lightVec;
varying float lightDistance;
//varying float attenuation;
//varying vec2 texCoord0;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);

    // transform the normal vector from object space to eye space
    // assume vertexNormal is already normalized.
    normalVec = (matrixNormal * vec4(vertexNormal, ONE)).xyz;

    // transform vertex position from object space to eye space
    positionVec = vec3(matrixModelView * vec4(vertexPosition, ONE));

    // compute view vector (from vertex to camera) in eye space
    viewVec = normalize(-positionVec);

    // compute light vector and attenuation
    //float attenuation;
    // directional light
    if(lightPosition.w == ZERO)
    {
        lightVec = normalize(lightPosition.xyz);
        lightDistance = ZERO;
    }
    // positional light
    else
    {
        // compute light vector in eye space
        lightVec = lightPosition.xyz - positionVec;
        lightDistance = length(lightVec);
        lightVec = normalize(lightVec);

        /*
        // compute attenuation: 1 / (k0 + k1*d + k2*d*d)
        vec3 attFact;
        attFact.x = ONE;                        // 1
        attFact.z = dot(lightVec, lightVec);    // dist * dist
        attFact.y = sqrt(attFact.z);            // dist
        attenuation = ONE / dot(lightAttenuation, attFact);

        lightVec = normalize(lightVec);
        */
    }

    // pass texture coord
    //texCoord0 = vertexTexCoord0;
}
