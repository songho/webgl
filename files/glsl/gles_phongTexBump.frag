///////////////////////////////////////////////////////////////////////////////
// gles_phongTex.frag
// ==================
// Per-Pixel lighting shader with 1 texture (Bui-Tuong Phong lighting model)
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection    vertexTexCoord0         texCoord0
// lightPosition                vertexTangent
// lightColor
// lightAttenuation
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
// map1
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2025-05-16
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// uniforms
uniform vec4 lightColor;
uniform vec4 lightPosition;             // should be in the eye space
uniform vec3 lightAttenuation;          // attenuation coefficients (k0, k1, k2)
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
uniform sampler2D map0;                 // texture map #1
uniform sampler2D map1;                 // normal map

// varying variables
varying vec3 normalVec;                 // normal vector in eye space
varying vec3 positionVec;               // vertex position in eye space
varying vec2 texCoord0;                 // texture coords
varying vec3 tangentVec;                // tangent vector in eye space
varying vec3 binormalVec;               // binormal (bitangent) vector in eye space

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 tangent = normalize(tangentVec);
    vec3 binormal = normalize(binormalVec);

    // TBN matrix
    mat3 matrixTbn = mat3(tangent, binormal, normal);

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
        attenuation = ONE / dot(lightAttenuation, attFact);

        light = normalize(light);
    }

    // compute view vector (from vertex to camera) in eye space
    vec3 view = normalize(-positionVec);

    // compute view vector in tangent space with TBN matrix
    vec3 tsView = matrixTbn * view;

    // compute light vector in tangent space with TBN matrix
    vec3 tsLight = matrixTbn * light;

    // get normal in tangent space from normal map, then set the range from [0, 1] to [-1, 1]
    vec3 tsNormal = normalize(texture2D(map1, texCoord0).rgb * 2.0 - ONE);

    // compute reflected ray vector in tangent space: 2 * (N dot L) * N - L
    vec3 tsReflect = reflect(-tsLight, tsNormal);

    // start with ambient
    vec3 color = materialAmbient.xyz;

    // add diffuse portion using Lambert cosine law
    float dotNL = max(dot(tsNormal, tsLight), ZERO);
    color += dotNL * materialDiffuse.xyz * lightColor.xyz;

    // apply texture before specular
    color *= texture2D(map0, texCoord0).rgb;

    // add specular portion
    float dotVR = max(dot(tsView, tsReflect), ZERO);
    color += pow(dotVR, materialShininess) * materialSpecular.xyz * lightColor.xyz;
    //color = materialAmbient.xyz;

    // set frag color
    gl_FragColor = vec4(color * attenuation, materialDiffuse.a);  // keep alpha as original material has
}
