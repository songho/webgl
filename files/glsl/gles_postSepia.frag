///////////////////////////////////////////////////////////////////////////////
// gles_postSepia.frag
// ===================
// post-processing: sepia
// weight example: R = 0.393 * r + 0.769 * g + 0.189 * b
//                 G = 0.349 * r + 0.686 * g + 0.168 * b
//                 B = 0.272 * r + 0.534 * g + 0.131 * b
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-02
// UPDATED: 2017-08-15
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform sampler2D map0;       // texture map #1
uniform mat4 weight;

// varying variables
varying vec2 texCoord0;                 // texture coords

void main(void)
{
    gl_FragColor = weight * texture2D(map0, texCoord0);
}
