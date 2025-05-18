#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles_select.frag
// ================
// vertex shder for selection buffer
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2020-02-24
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 pickColor;

// varying variables
in vec4 normalVec;  //@@ NOT USED

// output
out vec4 fragColor;

void main(void)
{
    fragColor = pickColor;
}
