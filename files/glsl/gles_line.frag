///////////////////////////////////////////////////////////////////////////////
// gles_line.frag
// ==============
// flat shader for lines with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2014-08-27
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 color;         // material diffuse color

void main(void)
{
    gl_FragColor = color;
}
