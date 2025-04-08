///////////////////////////////////////////////////////////////////////////////
// gles_flat.vert
// ==============
// flat shading with diffuse color
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-03-19
// UPDATED: 2017-03-03
///////////////////////////////////////////////////////////////////////////////

// vertex attributes
attribute vec3 vertexPosition;

// uniforms
uniform mat4 matrixModel;
uniform mat4 matrixView;
uniform mat4 matrixProjection;
uniform mat4 matrixModelView;
uniform mat4 matrixModelViewProjection;
uniform bool matrixComputed;


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
        vec4 pos = matMV * vec4(vertexPosition, 1.0);
        if(pos.z > 0.0)
        {
                pos.z = -pos.z;
                pos.y = -1.0;
        }
        gl_Position = matrixProjection * pos;
    }
}
