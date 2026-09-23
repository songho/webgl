///////////////////////////////////////////////////////////////////////////////
// gles_depth.frag
// ===============
// draw to depth buffer
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2012-09-19
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif



void main(void)
{
    // fill color buffer
    gl_FragColor = vec4(0.0);
}
