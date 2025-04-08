///////////////////////////////////////////////////////////////////////////////
// gles_pointTex2d.frag
// ====================
// Shader for 2D points using ortho projection with texture
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2017-08-11
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 color;           // point color
uniform sampler2D map0;       // texture map #1

void main(void)
{
    gl_FragColor = color * texture2D(map0, gl_PointCoord);
}
