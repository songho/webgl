///////////////////////////////////////////////////////////////////////////////
// gles_postGray.frag
// ==================
// post-processing: grayscale
// grayscale weight must be provided, e.g: 0.299 * r + 0.587 * g + 0.114 * b
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-02
// UPDATED: 2017-09-05
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform sampler2D map0;       // texture map #1
uniform vec3 weight;          // r,g,b
uniform float gamma;

// varying variables
varying vec2 texCoord0;                 // texture coords

void main(void)
{
    vec4 texel = texture2D(map0, texCoord0);
    float gray = dot(pow(texel.rgb, vec3(gamma)), weight);
    //gray = smoothstep(0.0, 1.0, texel.r);
    gl_FragColor = vec4(vec3(gray), texel.a);
}
