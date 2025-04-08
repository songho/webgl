///////////////////////////////////////////////////////////////////////////////
// gles_perVertexLighting.vert
// ===========================
// per-vertex lighting with single light source
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-02-01
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
uniform vec4 ambient;                   // material ambient color
uniform vec4 specular;                  // material specular color
uniform float shininess;                // material specular exponent

// varying variables
varying vec4 color;

// local variables
vec4 eyeVertexVec;
vec4 normalVec;


///////////////////////////////////////////////////////////////////////////////
// compute lighting for single light
// It references the following
// UNIFORMS: lightPosition, lightColor, lightAttenuations, matrixModelView,
//           ambient, specular, shininess
// ATTRIBUTES: vertexPosition, vertexColor
// LOCAL VARS: normalVec, eyeVertexVec
///////////////////////////////////////////////////////////////////////////////
vec4 computeLighting()
{
    vec4 color = ambient;
    vec3 lightVec;
    vec3 halfVec;
    float attFactor;
    float dotNL;
    float dotNH;

    // directional light
    if(lightPosition.w == 0.0)
    {
        lightVec = lightPosition.xyz;   // light vector does not change in directional
        attFactor = 1.0;
    }
    // positional light
    else
    {
        // transform vertex pos to eye space
        eyeVertexVec = matrixModelView * vec4(vertexPosition, 1.0);

        // compute light vector for positional
        lightVec = lightPosition.xyz - eyeVertexVec.xyz;

        // compute attenuation 1 / (k0 + k1 * d + k2 * (d*d))
        vec3 attDist;
        attDist.x = 1.0;                        // 1
        attDist.z = dot(lightVec, lightVec);    // d^2
        attDist.y = sqrt(attDist.z);            // d
        attFactor = 1.0 / dot(attDist, lightAttenuations);

        lightVec = normalize(lightVec);
    }

    // compute half vector, eye vector is always (0,0,1) at eye space
    halfVec = normalize(lightVec + vec3(0,0,1));

    dotNL = max(dot(normalVec.xyz, lightVec.xyz), 0.0);
    dotNH = dot(normalVec.xyz, halfVec);

    if(attFactor > 0.0)
    {
        // add diffuse
        color += vertexColor * lightColor * dotNL;

        // add specular
        if(dotNH > 0.0)
            color += specular * lightColor * pow(dotNH, shininess);

        // add attenuation
        if(attFactor < 1.0)
            color *= attFactor;
    }

    color.a = vertexColor.a;    // keep alpha as original
    return color;
}



void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1);

    // transform the normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    normalVec = matrixNormal * vec4(vertexNormal, 1.0);

    if(lightEnabled)
        color = computeLighting();
    else
        color = vertexColor;
}
