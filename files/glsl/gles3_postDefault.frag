#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles3_postDefault.frag
// ======================
// post-processing: no effect
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-02
// UPDATED: 2025-09-26
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform sampler2D map0;       // texture map #1

// varying variables
in vec2 texCoord0;            // texture coords

// output
out vec4 fragColor;

void main(void)
{
    fragColor = texture(map0, texCoord0);
}
