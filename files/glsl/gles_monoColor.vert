///////////////////////////////////////////////////////////////////////////////
// gles_monoColor.vert
// ===================
// flat shading with single-tone color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-09-25
// UPDATED: 2012-09-25
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;

// uniforms
uniform mat4 matrixModelViewProjection;


void main(void)
{
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);
}
