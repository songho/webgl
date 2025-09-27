#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles3_postDefault.vert
// ======================
// post-processing: no effect
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-08-02
// UPDATED: 2025-09-26
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
in vec2 vertexPosition;     // (x, y)
in vec2 vertexTexCoord0;    // (s, t)

// uniforms
uniform vec2 screenDimension;

// varying variables
out vec2 texCoord0;         // texture coords

void main(void)
{
    // texture coords
    texCoord0 = vertexTexCoord0;

    // normalized position [-1, 1]
    // assume viewport is set with full dimension (w x h)
    vec2 normalizedPosition = (vertexPosition / screenDimension) * 2.0 - 1.0;
    gl_Position = vec4(normalizedPosition, -1.0, 1.0);  // at the near plane
}
