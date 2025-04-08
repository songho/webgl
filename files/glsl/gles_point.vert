///////////////////////////////////////////////////////////////////////////////
// gles_point.vert
// ===============
// Shader for 2D/3D points
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2013-10-25
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
uniform float pointSize;

void main(void)
{
    mat4 matMVP = matrixProjection * matrixView * matrixModel;
    gl_Position = matMVP * vec4(vertexPosition, ONE);
    gl_PointSize = pointSize;
}
