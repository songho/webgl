///////////////////////////////////////////////////////////////////////////////
// gles_flat.frag
// ==============
// flat shader with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2017-03-19
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 materialDiffuse;           // material diffuse color

void main(void)
{
    gl_FragColor = materialDiffuse;
}
