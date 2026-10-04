///////////////////////////////////////////////////////////////////////////////
// gles_postRed.frag
// =================
// post-processing: red channel only
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-02
// UPDATED: 2017-08-14
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform sampler2D map0;       // texture map #1

// varying variables
varying vec2 texCoord0;                 // texture coords

void main(void)
{
    gl_FragColor = vec4(texture2D(map0, texCoord0).rrr, 1.0);
}
