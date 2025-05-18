#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles_select.vert
// ================
// vertex shder for selection buffer
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2020-02-24
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
in vec3 vertexPosition;
in vec3 vertexNormal;

// uniforms
uniform mat4 matrixModelViewProjection;

// varying variables
out vec4 normalVec;

void main(void)
{
    // transform vertex position to clip space
    gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);

    // vertex normal is not transformed in this shader, but it olny allows
    // the app can pass the attribute of normals same as regular rendering does
    // without disabling vertextAttribPointer()
    normalVec = vec4(vertexNormal, 1.0);
}
