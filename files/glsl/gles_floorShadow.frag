///////////////////////////////////////////////////////////////////////////////
// gles_floorShadow.frag
// =====================
// floor with shadow
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2026-09-07
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
const float SHADOW_ALPHA = 0.5;     // default blend alpha
const int HALF_KERNEL = 2;          // half range of kernel
const int KERNEL_COUNT = 25;        // total number of samples in kernel



///////////////////////////////////////////////////////////////////////////////
// generate pseudo random number between 0 and 1 from (x,y) 2D screen coordinate
///////////////////////////////////////////////////////////////////////////////
float rand(vec2 coord)
{
    return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);
}



///////////////////////////////////////////////////////////////////////////////
// smooth shadow blend factor using box filter
///////////////////////////////////////////////////////////////////////////////
float computeShadowFactor(vec3 shadowCoord)
{
    if(!blurEnabled)
        return SHADOW_ALPHA;

    //float randX = rand(gl_FragCoord.xy);
    //float randY = rand(gl_FragCoord.xy * 2.718); // offset seed
    //vec2 jitter = vec2(randX, randY) - 0.5;

    float sum = 0.0;
    vec2 offset;
    float depth;
    for(int i = -HALF_KERNEL; i <= HALF_KERNEL; ++i)
    {
        for(int j = -HALF_KERNEL; j <= HALF_KERNEL; ++j)
        {
            offset = vec2(float(i), float(j)) * 1.0 / shadowDimension;
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

    // compute diffuse factor using Lambert cosine law
    float dotNL = max(dot(normal, light), 0.0);

    // add diffuse
    color += dotNL * diffuse.xyz;

    // apply texture before specular
    vec4 texel = texture2D(map0, texCoord0);
    color *= texel.rgb;

    vec3 shadowCoord = lsPosition.xyz / lsPosition.w;
    shadowCoord = clamp(shadowCoord, 0.0, 1.0);
    //float shadowDepth = convertRgbToDepth(texture2D(map1, shadowCoord.xy).rgb);
    vec4 shadowmap = texture2D(map1, shadowCoord.xy);
    if((shadowCoord.z - depthOffset) > shadowmap.r)
    {
        // depth value of current fragment in light-space is greater than shadowmap
        //color = vec3(computeShadowFactor(shadowCoord));
        color = mix(color, SHADOW_COLOR, computeShadowFactor(shadowCoord));
    }
    else
    {
        // add spacular
        float dotNH = max(dot(normal, halfv), 0.0);
        color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

        /*
        // compute attenuation factor for positional light: 1 / (k0 + k1 * d + k2 * (d*d))
        float attFactor = 1.0 / dot(lightAttenuations, vec3(1.0, lightDistance, lightDistance * lightDistance));

        // add attenuation
        color *= attFactor;
        */
    }

    // set frag color
    //gl_FragColor = vec4(color, diffuse.a * texel.a);
    gl_FragColor = vec4(color, diffuse.a);
}
