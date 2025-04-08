///////////////////////////////////////////////////////////////////////////////
// gles_blur.vert
// ==============
// blur image with gaussian
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-26
// UPDATED: 2012-09-26
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec2 vertexPosition;      // 2D position between (-1,-1) ~ (1,1)
attribute vec2 vertexTexCoord;


varying vec2 texCoord;

void main(void)
{
    gl_Position = vec4(vertexPosition, 0, 1);
    texCoord = vertexTexCoord;
}
