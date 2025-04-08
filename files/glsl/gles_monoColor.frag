///////////////////////////////////////////////////////////////////////////////
// gles_monoColor.frag
// ===================
// flat shader with mono-tone color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-25
// UPDATED: 2012-09-25
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 color;

void main(void)
{
    gl_FragColor = color;
}
