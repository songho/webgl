#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles3_sprite.vert
// =================
// Shader for 2D/3D sprite with 1 textute map
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-08
// UPDATED: 2025-09-26
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
in vec3 vertexPosition;
in vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixModel;
uniform mat4 matrixView;
uniform mat4 matrixProjection;
uniform mat4 matrixModelViewProjection;
uniform bool matrixComputed;

// varying variables
out vec2 texCoord0;


void main(void)
{
    // transform vertex position to clip space
    if(matrixComputed)
    {
        gl_Position = matrixModelViewProjection * vec4(vertexPosition, 1.0);
    }
    else
    {
        mat4 matMV = matrixView * matrixModel;

        // lock rotation of modelview matrix
        matMV[0] = vec4(1.0, 0.0, 0.0, 0.0);    // first column (left axis)
        matMV[1] = vec4(0.0, 1.0, 0.0, 0.0);    // second column (up axis)
        matMV[2] = vec4(0.0, 0.0, 1.0, 0.0);    // third column (forward axis)

        mat4 matMVP = matrixProjection * matMV;
        gl_Position = matMVP * vec4(vertexPosition, 1.0);
    }

    // pass texture coord
    texCoord0 = vertexTexCoord0;
}
