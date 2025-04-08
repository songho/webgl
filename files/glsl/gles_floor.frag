///////////////////////////////////////////////////////////////////////////////
// gles_floor.frag
// ===============
// 
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-02-09
// UPDATED: 2012-02-09
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
uniform sampler2D map0;                 // base texture map
//uniform sampler2D map1;                 // second texture map


// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;
//@@varying vec4 texCoord1;

void main(void)
{
    if(!lightEnabled)
    {
        gl_FragColor = texture2D(map0, texCoord0) * diffuse;
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
    {
        attFactor = 1.0 / (lightAttenuations[0] +
                           lightAttenuations[1] * lightDistance +
                           lightAttenuations[2] * lightDistance * lightDistance);
    }

    // start with ambient
    vec3 color = ambient.rgb;

    if(attFactor > 0.0)
    {
        // add diffuse
        if(dotNL > 0.0)
            color += dotNL * diffuse.rgb;

        /*
        // apply texturing before specular
        vec4 texel0 = texture2D(map0, texCoord0);
        vec4 texel1 = texture2DProj(map1, texCoord1) * 0.5;
        vec4 texel;
        if(texCoord1.q > 0.0)
            texel = mix(texel0, texel1, 1.0-texel0.a);
        else
            texel = texel0;

        color *= texel.rgb;
        */
        vec4 texel = texture2D(map0, texCoord0);
        color *= texel.rgb;

        // add specular
        //if(dotNH > 0.0)
        //    color += pow(dotNH, materialShininess) * materialSpecular.rgb * lightColor.rgb;

        // apply attenuation
        //if(attFactor < 1.0)
        //    color *= attFactor;

        gl_FragColor = vec4(color.rgb, diffuse.a * texel.a);
    }
}
