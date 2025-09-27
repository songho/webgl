#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles3_sprite.frag
// =================
// Shader for 2D/3D sprite with 1 textute map
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-08
// UPDATED: 2025-09-26
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform sampler2D map0;                 // base texture map
uniform vec4 materialDiffuse;           // material diffuse color

// varying variables
in vec2 texCoord0;

// output
out vec4 fragColor;

void main(void)
{
    fragColor = texture(map0, texCoord0) * materialDiffuse;
}
