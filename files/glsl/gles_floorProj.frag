///////////////////////////////////////////////////////////////////////////////
// gles_floorProj.frag
// ===================
// floor with projected texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2012-09-25
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
uniform sampler2D map1;                 // proj texture map

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;
varying vec4 projCoord;




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
    //color *= texel.rgb;

    // add spacular
    //float dotNH = max(dot(normal, halfv), 0.0);
    //color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

    /*
    // compute attenuation factor for positional light: 1 / (k0 + k1 * d + k2 * (d*d))
    float attFactor = 1.0 / dot(lightAttenuations, vec3(1.0, lightDistance, lightDistance * lightDistance));

    // add attenuation
    color *= attFactor;
    */

    vec3 coord = projCoord.xyz / projCoord.w;
    coord = clamp(coord, 0.0, 1.0);
    //coord.z *= 0.98; // offset
    vec3 projColor = texture2D(map1, coord.xy).rgb;
    color *= projColor;

    // set frag color
    gl_FragColor = vec4(color, diffuse.a * texel.a);
    gl_FragColor = vec4(color, diffuse.a);
}
