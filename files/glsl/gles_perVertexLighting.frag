///////////////////////////////////////////////////////////////////////////////
// gles_perVertexLighting.frag
// ===========================
// Fragment shader with single light source
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-02-01
// UPDATED: 2011-02-01
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// varying variables from vertex shader
varying vec4 color;

void main(void)
{
    gl_FragColor = color;
}
