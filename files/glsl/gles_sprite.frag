///////////////////////////////////////////////////////////////////////////////
// gles_sprite.frag
// ================
// Shader for 2D/3D sprite with 1 textute map
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-08
// UPDATED: 2012-03-08
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
varying vec2 texCoord0;


void main(void)
{
    gl_FragColor = texture2D(map0, texCoord0) * materialDiffuse;
}
