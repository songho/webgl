///////////////////////////////////////////////////////////////////////////////
// gles_xray.frag
// ==============
// x-ray rendering
// (Referenced from AMD/ATI ASHLI)
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-15
// UPDATED: 2012-01-15
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform float edgeFalloff;

// varying variables
varying vec4 eyeVec;
varying vec4 normalVec;
varying vec4 color;

void main(void)
{
    // re-normalize varying vars and store them as local vars
    vec3 eye = normalize(eyeVec.xyz);
    vec3 normal = normalize(normalVec.xyz);

    // compute opacity
    float opacity = 1.0 - pow(dot(normal, -eye), edgeFalloff);

    gl_FragColor =  color * opacity;
}
