///////////////////////////////////////////////////////////////////////////////
// gles_floorShadow.frag
// =====================
// floor with shadow
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2012-09-24
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
uniform sampler2D map1;                 // shadow texture map
uniform float linearDepthFactor;        // 1 / (far - near)

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;
varying vec4 shadowCoord;
varying vec4 esPosition;



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
    vec4 texel = texture2D(map1, texCoord0);
    //color *= texel.rgb;

    //float d = convertRgbToDepth(texture2D(map1, texCoord0).rgb);
    //color = vec3(d);

    // add spacular
    //float dotNH = max(dot(normal, halfv), 0.0);
    //color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

    /*
    // compute attenuation factor for positional light: 1 / (k0 + k1 * d + k2 * (d*d))
    float attFactor = 1.0 / dot(lightAttenuations, vec3(1.0, lightDistance, lightDistance * lightDistance));

    // add attenuation
    color *= attFactor;
    */

    vec3 coord = shadowCoord.xyz / shadowCoord.w;
    coord = clamp(coord, 0.0, 1.0);
    //coord.z *= 0.99; // offset
    float shadowDepth = convertRgbToDepth(texture2D(map1, coord.xy).rgb);
    if(coord.z > shadowDepth)
        color *= 0.5;

    // set frag color
    gl_FragColor = vec4(color, diffuse.a * texel.a);
    gl_FragColor = vec4(color, diffuse.a);
}
