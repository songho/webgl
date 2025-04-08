///////////////////////////////////////////////////////////////////////////////
// gles_perPixelColor.frag
// =======================
// Per-Pixel lighting shader with vertex color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2012-01-11
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform bool lightEnabled;
uniform vec4 lightColor;
uniform vec3 lightAttenuations;         // constant, linear, quadratic attanuations
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;

void main(void)
{
    if(!lightEnabled)
    {
        gl_FragColor = diffuse;
        return;
    }

    // re-normalize varying vars and store them as local vars
    vec3 normal = normalize(normalVec.xyz);
    vec3 halfv = normalize(halfVec);
    vec3 light = normalize(lightVec);

    // compute attenuations for positional light
    float dotNL = max(dot(normal, light), 0.0);
    float dotNH = dot(normal, halfv);

    // compute attenuation factor: 1 / (k0 + k1 * d + k2 * (d*d))
    float attFactor = 1.0;
    if(lightDistance > 0.0)
        attFactor = 1.0 / (lightAttenuations[0] +
                           lightAttenuations[1] * lightDistance +
                           lightAttenuations[2] * lightDistance * lightDistance);

    // start with ambient
    vec3 color = ambient.xyz;

    if(attFactor > 0.0)
    {
        // add diffuse
        color += dotNL * diffuse.xyz;

        // add specular
        if(dotNH > 0.0)
            color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

        // add attenuation
        if(attFactor < 1.0)
            color *= attFactor;

        gl_FragColor = vec4(color, diffuse.a);  // keep alpha as original material has
    }
}
