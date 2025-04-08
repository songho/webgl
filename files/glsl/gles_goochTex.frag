///////////////////////////////////////////////////////////////////////////////
// gles_goochTex.frag
// ==================
// Gooch shading
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2016-06-24
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
//uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
//uniform vec4 materialSpecular;          // material specular color
//uniform float materialShininess;        // material specular exponent
uniform sampler2D map0;                 // texture map #1
uniform vec4 warmColor;
uniform vec4 coolColor;
uniform float warmWeight;
uniform float coolWeight;
//uniform float outlineWidth;

// varying variables
varying vec3 normalVec;
varying vec3 lightVec;
varying vec3 viewVec;
varying vec2 texCoord0;
varying float lightDistance;

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 light = normalize(lightVec);
    vec3 view = normalize(viewVec);
    vec3 reflectVec = reflect(-light, normal); // compute reflected ray vector

    // first get diffuse
    vec4 color = materialDiffuse;

    // apply texture before specular
    color *= texture2D(map0, texCoord0);

    vec4 warm = min(warmColor + color * warmWeight, ONE);
    vec4 cool = min(coolColor + color * coolWeight, ONE);

    float dotNL = (dot(normal, light) + 1.0) * 0.5;
    float dotVR = max(dot(view, reflectVec), ZERO);

    // interpolate
    color = min(mix(cool, warm, dotNL), ONE);

    // add specular
    //float specular = pow(dotVR, materialShininess);
    //color = min(color + specular, ONE);

    // set frag color
    gl_FragColor = vec4(color.rgb, materialDiffuse.a);  // keep alpha as original material has
}
