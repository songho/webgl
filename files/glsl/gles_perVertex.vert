///////////////////////////////////////////////////////////////////////////////
// gles_perVertex.vert
// ===================
// Per-Vertex lighting shader (Gouraud shading) with single light source
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          color
// matrixModelView              vertexNormal
// matrixModelViewProjection
// lightPosition
// lightColor
// lightAttenuations
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-02-01
// UPDATED: 2023-03-24
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

// uniforms
uniform mat4 matrixNormal;
uniform mat4 matrixView;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform vec4 lightPosition;             // should be on the eye space
uniform vec4 lightColor;
uniform vec3 lightAttenuations;         // attenuation coefficients (k0, k1, k2)
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent

// varying variables
varying vec4 color;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);

    // transform normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    vec3 normalVec = vec3(matrixNormal * vec4(vertexNormal, 1.0));

    // compute directional light
    vec3 lightVec;
    float attenuation;
    if(lightPosition.w == 0.0)
    {
        lightVec = lightPosition.xyz;   // light vector does not change in directional
        attenuation = 1.0;              // no attenuation for directional
    }
    // compute positional light
    else
    {
        // transform vertex position from object space to eye space
        vec3 vertexVec = vec3(matrixModelView * vec4(vertexPosition, 1.0));

        // compute light vector in eye space
        lightVec = lightPosition.xyz - vertexVec;

        // compute attenuation 1 / (k0 + k1 * d + k2 * (d*d))
        vec3 attFact;
        attFact.x = 1.0;                        // 1
        attFact.z = dot(lightVec, lightVec);    // d^2
        attFact.y = sqrt(attFact.z);            // d
        attenuation = 1.0 / dot(lightAttenuations, attFact);

        lightVec = normalize(lightVec);
    }

    // compute half vector, eye vector is always (0,0,1) at eye space
    vec3 halfVec = normalize(lightVec + vec3(0,0,1));

    // start with ambient
    color = materialAmbient;

    // add diffuse
    float dotNL = max(dot(normalVec, lightVec), 0.0);
    color += materialDiffuse * lightColor * dotNL;

    // add specular
    float dotNH = max(dot(normalVec, halfVec), 0.0);
    color += materialSpecular * lightColor * pow(dotNH, materialShininess);

    // apply attenuation
    color *= attenuation;
    color.a = materialDiffuse.a;    // keep alpha as original material has
}
