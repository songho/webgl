///////////////////////////////////////////////////////////////////////////////
// gles_depth.vert
// ===============
// flat shading with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2012-09-20
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;

// uniforms
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;

varying vec4 position;

void main(void)
{
    position = matrixModelView * vec4(vertexPosition, 1.0);
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);
}
