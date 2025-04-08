///////////////////////////////////////////////////////////////////////////////
// gles_flat.vert
// ==============
// flat shading with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2017-06-18
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
uniform mat4 matrixModelViewProjection;
uniform bool matrixComputed;


void main(void)
{
    // transform vertex position to clip space
    if(matrixComputed)
    {
        gl_Position = matrixModelViewProjection * vec4(vertexPosition, ONE);
    }
    else
    {
        mat4 matMVP = matrixProjection * matrixView * matrixModel;
        gl_Position = matMVP * vec4(vertexPosition, ONE);
    }
}
