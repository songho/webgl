#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles3_point.vert
// ===============
// Shader for 2D/3D points
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2025-09-26
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
in vec3 vertexPosition;

// uniforms
uniform mat4 matrixModel;
uniform mat4 matrixView;
uniform mat4 matrixProjection;
uniform float pointSize;

void main(void)
{
    mat4 matMVP = matrixProjection * matrixView * matrixModel;
    gl_Position = matMVP * vec4(vertexPosition, 1.0);
    gl_PointSize = pointSize;
}
