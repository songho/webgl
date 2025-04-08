///////////////////////////////////////////////////////////////////////////////
// gles_phongBump.frag
// ===================
// Phong lighting shader with 1 normalmap
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection    vertexTexCoord0         texCoord0
// lightPosition                vertexTangent           tangentVec
// lightColor                                           binormalVec
// lightAttenuations
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2015-06-04
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;
const float TWO  = 2.0;

// uniforms
uniform vec4 lightColor;
uniform vec4 lightPosition;             // should be in the eye space
uniform vec3 lightAttenuation;          // attenuation coefficients (k0, k1, k2)
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
uniform sampler2D map0;                 // normal map

// varying variables
varying vec3 normalVec;                 // normal vector in eye space
varying vec3 positionVec;               // vertex position in eye space
varying vec2 texCoord0;                 // texture coords
varying vec3 tangentVec;                // tangent basis vector in eye space
varying vec3 binormalVec;               // binormal basis vector in eye space

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 tangent = normalize(tangentVec);
    vec3 binormal = normalize(binormalVec);

    // compute light vector and attenuation
    vec3 light;
    float attenuation;
    // directional light
    if(lightPosition.w == ZERO)
    {
        light = normalize(lightPosition.xyz);
        attenuation = ONE;
    }
    // positional light
    else
    {
        // compute light vector in eye space
        light = lightPosition.xyz - positionVec;

        // compute attenuation: 1 / (k0 + k1*d + k2*d*d)
        vec3 attFact;
        attFact.x = ONE;                // 1
        attFact.z = dot(light, light);  // dist * dist
        attFact.y = sqrt(attFact.z);    // dist
        attenuation = ONE / dot(lightAttenuations, attFact);

        light = normalize(light);
    }

    // compute view vector (from vertex to camera) in eye space
    vec3 view = normalize(-positionVec);

    // compute view vector
    vec3 tsView;
    tsView.x = dot(tangent,  view);
    tsView.y = dot(binormal, view);
    tsView.z = dot(normal,   view);

    // get normal in tangent space from normal map, then set the range from [0, 1] to [-1, 1]
    vec3 tsNormal = normalize(texture2D(map0, texCoord0).rgb * TWO - ONE);

    /*
    // compute reflect vector in tangent space
    vec3 tsReflect;
    tsReflect.x = dot(tangent,  reflectVec);
    tsReflect.y = dot(binormal, reflectVec);
    tsReflect.z = dot(normal,   reflectVec);
    */

    // compute light vector in tangent space with TBN matrix
    vec3 tsLight;
    tsLight.x = dot(tangent,  light);
    tsLight.y = dot(binormal, light);
    tsLight.z = dot(normal,   light);

    // compute reflected ray vector in eye space: 2 * N * (N dot L) - L
    vec3 tsReflect = reflect(-tsLight, tsNormal);

    // start with ambient
    vec3 color = materialAmbient.xyz;

    // add diffuse portion using Lambert cosine law
    float dotNL = max(dot(tsNormal, tsLight), ZERO);
    color += dotNL * materialDiffuse.xyz * lightColor.xyz;

    // apply texture before specular
    //color *= texture2D(map0, texCoord0).rgb;

    // add specular portion
    float dotVR = max(dot(tsView, tsReflect), ZERO);
    color += pow(dotVR, materialShininess) * materialSpecular.xyz * lightColor.xyz;
    color = view;

    // set frag color
    gl_FragColor = vec4(color * attenuation, materialDiffuse.a);  // keep alpha as original material has
}
