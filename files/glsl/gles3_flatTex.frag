#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles_flatTex.frag
// =================
// flat shader with texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2017-09-06
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
    vec4 texel = texture(map0, texCoord0);
    fragColor = vec4(texel.rgb, 1.0);
}
