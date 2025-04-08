///////////////////////////////////////////////////////////////////////////////
// gles_perPixel.frag
// ==================
// Per-Pixel lighting shader
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2012-10-01
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
uniform vec3 lightAttenuations;         // attenuation coefficients (k0, k1, k2)
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
uniform sampler2D map0;                 // texture map #1

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;

void main(void)
{
    // re-normalize varying vars and store them as local vars
    vec3 normal = normalize(normalVec.xyz);
    vec3 halfv = normalize(halfVec);
    vec3 light = normalize(lightVec);

    // start with ambient
    vec3 color = ambient.xyz;

    // compute diffuse factor using Lambert cosine law
    float dotNL = max(dot(normal, light), ZERO);

    // add diffuse
    color += dotNL * diffuse.xyz;

    // apply texture before specular
    vec4 texel = texture2D(map0, texCoord0);
    color *= texel.rgb;

    // add spacular
    float dotNH = max(dot(normal, halfv), ZERO);
    color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

    /*
    // compute attenuation factor for positional light: 1 / (k0 + k1 * d + k2 * (d*d))
    float attFactor = 1.0 / dot(lightAttenuations, vec3(1.0, lightDistance, lightDistance * lightDistance));

    // add attenuation
    color *= attFactor;
    */

    // set frag color
    gl_FragColor = vec4(color, diffuse.a);  // keep alpha as original material has
}
