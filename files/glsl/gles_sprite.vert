///////////////////////////////////////////////////////////////////////////////
// gles_sprite.vert
// ================
// Shader for 2D/3D sprite with 1 textute map
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-08
// UPDATED: 2012-03-08
///////////////////////////////////////////////////////////////////////////////

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;

// vertex attributes
attribute vec3 vertexPosition;
attribute vec2 vertexTexCoord0;

// uniforms
uniform mat4 matrixModel;
uniform mat4 matrixView;
uniform mat4 matrixProjection;
uniform mat4 matrixModelViewProjection;
uniform bool matrixComputed;

// varying variables
varying vec2 texCoord0;


void main(void)
{
    // transform vertex position to clip space
    if(matrixComputed)
    {
        gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);
    }
    else
    {
        mat4 matMV = matrixView * matrixModel;

        // lock rotation of modelview matrix
        matMV[0] = vec4(ONE,  ZERO, ZERO, ZERO);    // first column (left axis)
        matMV[1] = vec4(ZERO, ONE,  ZERO, ZERO);    // second column (up axis)
        matMV[2] = vec4(ZERO, ZERO, ONE,  ZERO);    // third column (forward axis)

        mat4 matMVP = matrixProjection * matMV;
        gl_Position = matMVP * vec4(vertexPosition, ONE);
    }

    // pass texture coord
    texCoord0 = vertexTexCoord0;
}
