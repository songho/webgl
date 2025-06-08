///////////////////////////////////////////////////////////////////////////////
// gles_blurGaussian.vert
// ======================
// blur image with separable gaussian kernel
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2025-06-05
///////////////////////////////////////////////////////////////////////////////

const float ZERO = 0.0;
const float ONE  = 1.0;
const float TWO  = 2.0;

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

    // normalized position [-1, 1]
    vec2 normPosition = (vertexPosition / screenDimension) * TWO - ONE;
    gl_Position = vec4(normPosition, ZERO, ONE);
}
