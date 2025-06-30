///////////////////////////////////////////////////////////////////////////////
// gles_convolve1d.vert
// ====================
// 1D convolution
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2025-06-05
///////////////////////////////////////////////////////////////////////////////

// input vertex attributes
attribute vec2 vertexPosition;      // 2D position
attribute vec2 vertexTexCoord0;

// uniforms
uniform vec2 screenDimension;

// output varying vars
varying vec2 texCoord0;

void main(void)
{
    texCoord0 = vertexTexCoord0;

    // normalized position [-1, 1] to fit in screen
    vec2 normPosition = (vertexPosition / screenDimension) * 2.0 - 1.0;
    gl_Position = vec4(normPosition, 0.0, 1.0);
}
