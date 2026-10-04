///////////////////////////////////////////////////////////////////////////////
// gles_blinnTex.frag
// ==================
// Per-Pixel lighting shader with 1 texture and 1 shadowmap
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixModel                  vertexPosition          esPosition
// matrixNormal                 vertexNormal            esNormal
// matrixModelView              vertexTexCoord0         texCoord0
// matrixModelViewProjection                            lsPosition
// matrixShadowMap
// lightPosition
// lightColor
// lightAttenuation
// depthOffset
// shadowDimension
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
// map1
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2026-10-03
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;
const vec3 SHADOW_COLOR = vec3(0.0, 0.0, 0.0);
const float SHADOW_ALPHA = 0.5;     // default shadow blend weight
const int HALF_KERNEL = 2;          // half range of kernel
const int KERNEL_COUNT = 25;        // total number of samples in kernel
const float SPREAD = 1.0;           // texel sampling radius

// uniforms
uniform vec4 lightColor;
uniform vec4 lightPosition;             // should be in the eye space
uniform vec3 lightAttenuation;          // attenuation coefficients (k0, k1, k2)
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
uniform float depthOffset;              // depth offset
uniform vec2 shadowDimension;           // shadow map size
uniform sampler2D map0;                 // texture map #1
uniform sampler2D map1;                 // shadow map

// varying variables
varying vec3 esPosition;                // vertex position in eye space
varying vec3 esNormal;                  // normal vector in eye space
varying vec2 texCoord0;                 // texture coords
varying vec4 lsPosition;                // vertex position in light space


///////////////////////////////////////////////////////////////////////////////
// generate pseudo random number between 0 and 1 from 2D screen coordinate
///////////////////////////////////////////////////////////////////////////////
float rand(vec2 coord)
{
    return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);
}



///////////////////////////////////////////////////////////////////////////////
// simple shadow test
// It is in shadow if depth value of current fragment in light-space is greater
// than shadowmap value, otherwise return 0 (no shadow)
/////////////////////////////////////////////////////////////////////////////// 
float computeShadowFactor(vec3 shadowCoord)
{
    float depth = texture2D(map1, shadowCoord.xy).r;
    if((shadowCoord.z - depthOffset) > depth)
            return SHADOW_ALPHA;    // in shadow
        else
            return 0.0;             // in lit
}



///////////////////////////////////////////////////////////////////////////////
// smooth shadow factor using NxN box filter
///////////////////////////////////////////////////////////////////////////////
float computeShadowFactorBlur(vec3 shadowCoord)
{
    float depth;
    vec2 offset;
    float sum = 0.0;
    for(int i = -HALF_KERNEL; i <= HALF_KERNEL; ++i)
    {
        for(int j = -HALF_KERNEL; j <= HALF_KERNEL; ++j)
        {
            offset = vec2(float(i), float(j)) * SPREAD / shadowDimension;
            depth = texture2D(map1, shadowCoord.xy + offset).r;
            // accumulate if it is in shadow
            if((shadowCoord.z - depthOffset) > depth)
                sum += 1.0;
        }
    }
    return SHADOW_ALPHA * (sum / float(KERNEL_COUNT));
}



///////////////////////////////////////////////////////////////////////////////
// compute shadow factor using screen-space random noise
///////////////////////////////////////////////////////////////////////////////
float computeShadowFactorNoise(vec3 shadowCoord)
{
    // generate random white noise in screen space
    float randX = rand(gl_FragCoord.xy);
    float randY = rand(gl_FragCoord.xy * 2.718); // offset seed
    vec2 noise = vec2(randX, randY) - 0.5;       // shift to [-0.5, 0.5]

    vec2 offset = (noise) * SPREAD / shadowDimension;
    float depth = texture2D(map1, shadowCoord.xy + offset).r;
    if((shadowCoord.z - depthOffset) > depth)
        return SHADOW_ALPHA;
    else
        return 0.0;
}



///////////////////////////////////////////////////////////////////////////////
// smooth shadow factor using screen-space random noise and box filter
///////////////////////////////////////////////////////////////////////////////
float computeShadowFactorNoiseBlur(vec3 shadowCoord)
{
    // generate random white noise in screen space
    float randX = rand(gl_FragCoord.xy);
    float randY = rand(gl_FragCoord.xy * 2.718); // offset seed
    vec2 noise = vec2(randX, randY) - 0.5;       // shift to [-0.5, 0.5]

    float sum = 0.0;
    vec2 offset;
    float depth;
    for(int i = -HALF_KERNEL; i <= HALF_KERNEL; ++i)
    {
        for(int j = -HALF_KERNEL; j <= HALF_KERNEL; ++j)
        {
            offset = (vec2(float(i), float(j)) + noise) * SPREAD / shadowDimension;
            depth = texture2D(map1, shadowCoord.xy + offset).r;
            // accumulate if it is in shadow
            if((shadowCoord.z - depthOffset) > depth)
                sum += 1.0;
        }
    }

    return SHADOW_ALPHA * (sum / float(KERNEL_COUNT));
}



///////////////////////////////////////////////////////////////////////////////
void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(esNormal);

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
        light = lightPosition.xyz - esPosition;

        // compute attenuation: 1 / (k0 + k1*d + k2*d*d)
        vec3 attFact;
        attFact.x = ONE;                // 1
        attFact.z = dot(light, light);  // dist * dist
        attFact.y = sqrt(attFact.z);    // dist
        attenuation = ONE / dot(lightAttenuation, attFact);

        light = normalize(light);
    }

    // compute view vector (from vertex to camera) in eye space
    vec3 view = normalize(-esPosition);

    // compute half vector H = (L + V) / |L + V|
    vec3 halfVec = normalize(light + view);

    // start with ambient
    vec3 color = materialAmbient.xyz;

    // add diffuse portion using Lambert cosine law
    float dotNL = max(dot(normal, light), ZERO);
    color += dotNL * materialDiffuse.xyz * lightColor.xyz;

    // compute shadow factor, 0 means lit (no shadow)
    vec3 shadowCoord = lsPosition.xyz / lsPosition.w;
    shadowCoord = clamp(shadowCoord, 0.0, 1.0);
    float shadowFactor;
    shadowFactor = computeShadowFactorBlur(shadowCoord);
    //shadowFactor = computeShadowFactorNoiseBlur(shadowCoord);
    //shadowFactor = computeShadowFactorNoise(shadowCoord);
    //shadowFactor = computeShadowFactor(shadowCoord);

    // blend shadow
    color = mix(color, SHADOW_COLOR, shadowFactor);

    // apply texture before specular
    color *= texture2D(map0, texCoord0).rgb;

    // add specular portion
    float dotNH = max(dot(normal, halfVec), ZERO);
    color += pow(1.0 - shadowFactor, 5.0) * pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

    // set frag color
    gl_FragColor = vec4(color * attenuation, materialDiffuse.a);  // keep alpha as original material has
}
