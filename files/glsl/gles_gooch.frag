///////////////////////////////////////////////////////////////////////////////
// gles_gooch.frag
// ===============
// Gooch shading
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2020-02-27
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
//uniform vec4 lightColor;
uniform vec4 lightPosition;             // should be in the eye space
uniform vec4 materialDiffuse;           // material diffuse color
uniform float materialShininess;        // material specular exponent
uniform vec4 warmColor;
uniform vec4 coolColor;
uniform float warmWeight;
uniform float coolWeight;
//uniform float outlineWidth;

// varying variables
varying vec3 normalVec;
varying vec3 lightVec;
varying vec3 viewVec;
//varying float lightDistance;

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 light = normalize(lightVec);
    vec3 view = normalize(viewVec);

    vec4 warm = min(warmColor + warmWeight * materialDiffuse, ONE);
    vec4 cool = min(coolColor + coolWeight * materialDiffuse, ONE);

    float dotNL = dot(normal, light);
    vec3 reflectVec = reflect(-light, normal); // compute reflected ray vector
    float dotVR = max(dot(view, reflectVec), ZERO);
    float specular = pow(dotVR, materialShininess);
    //vec4 color = min(mix(cool, warm, dotNL), ONE);
    //vec4 color = mix(cool, warm, dotNL);
    //vec4 color = min(mix(cool, warm, dotNL) + specular, ONE);
    vec4 color = mix(cool, warm, dotNL) + specular;

    //if(dot(normal, view) < 0.1) color = vec4(1.0, 0.0, 0.0, 1.0);

    // set frag color
    gl_FragColor = vec4(color.rgb, materialDiffuse.a);  // keep alpha as original material has
}
