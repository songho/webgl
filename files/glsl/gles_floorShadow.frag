///////////////////////////////////////////////////////////////////////////////
// gles_floorShadow.frag
// =====================
// floor with shadow
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2026-09-30
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 lightColor;
uniform vec3 lightAttenuations;         // constant, linear, quadratic attanuations
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
uniform sampler2D map0;                 // base texture map
uniform sampler2D map1;                 // depth texture map
uniform float depthOffset;              //
uniform bool blurEnabled;
uniform vec2 shadowDimension;
//uniform float linearDepthFactor;        // 1 / (far - near)

// input varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;
varying vec4 esPosition;
varying vec4 lsPosition;

// constants
const vec3 SHADOW_COLOR = vec3(0.0, 0.0, 0.0);
const float SHADOW_ALPHA = 0.5;     // default shadow blend weight
const int HALF_KERNEL = 2;          // half range of kernel
const int KERNEL_COUNT = 25;        // total number of samples in kernel
const float SPREAD = 1.0;           // texel sampling radius



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
// convert color (RBGA) to depth
///////////////////////////////////////////////////////////////////////////////
float convertRgToDepth(vec2 rg)      // to 16bit
{
    return dot(rg, vec2(1.0, 1.0/255.0));
}
float convertRgbToDepth(vec3 rgb)    // to 24bit
{
    return dot(rgb, vec3(1.0, 1.0/255.0, 1.0/65025.0));
}
float convertRgbaToDepth(vec4 rgba) // to 32bit
{
    return dot(rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0));
}



///////////////////////////////////////////////////////////////////////////////
void main(void)
{
    // re-normalize varying vars and store them as local vars
    vec3 normal = normalize(normalVec.xyz);
    vec3 halfv = normalize(halfVec);
    vec3 light = normalize(lightVec);

    // start with ambient
    vec3 color = ambient.xyz;

    // compute shadow factor, 0 means lit (no shadow)
    vec3 shadowCoord = lsPosition.xyz / lsPosition.w;
    shadowCoord = clamp(shadowCoord, 0.0, 1.0);
    float shadowFactor;
    if(blurEnabled)
        shadowFactor = computeShadowFactorBlur(shadowCoord);
        //shadowFactor = computeShadowFactorNoiseBlur(shadowCoord);
        //shadowFactor = computeShadowFactorNoise(shadowCoord);
    else
        shadowFactor = computeShadowFactor(shadowCoord);

    // compute diffuse factor using Lambert cosine law
    float dotNL = max(dot(normal, light), 0.0);

    // add diffuse
    color += dotNL * diffuse.xyz;

    // blend shadow
    color = mix(color, SHADOW_COLOR, shadowFactor);

    // apply texture
    vec4 texel = texture2D(map0, texCoord0);
    color *= texel.rgb;

    // add spacular
    float dotNH = max(dot(normal, halfv), 0.0);
    color += pow(1.0 - shadowFactor, 5.0) * pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

    // compute attenuation factor for positional light: 1 / (k0 + k1 * d + k2 * (d*d))
    //float attFactor = 1.0 / dot(lightAttenuations, vec3(1.0, lightDistance, lightDistance * lightDistance));

    // add attenuation
    //color *= attFactor;

    // set frag color
    gl_FragColor = vec4(color, diffuse.a * texel.a);
}
