///////////////////////////////////////////////////////////////////////////////
// gles_line.vert
// ==============
// flat shading for lines with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2014-08-27
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;

// uniforms
uniform mat4 matrixModel;
uniform mat4 matrixView;
uniform mat4 matrixProjection;

void main(void)
{
    mat4 matMVP = matrixProjection * matrixView * matrixModel;
    gl_Position = matMVP * vec4(vertexPosition, ONE);
}
