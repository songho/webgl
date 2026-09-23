///////////////////////////////////////////////////////////////////////////////
// gles_flatTexDepth.frag
// ======================
// flat shading with depth texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2026-09-07
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
//uniform vec4 materialDiffuse;           // material diffuse color
uniform sampler2D map0;                 // depth texture map

// input varying variables
varying vec2 texCoord0;

void main(void)
{
    gl_FragColor = vec4(texture2D(map0, texCoord0).rrr, 1.0);
}
