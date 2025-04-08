///////////////////////////////////////////////////////////////////////////////
// gles_perVertex.frag
// ===================
// Per-Vertex lighting shader (Gouraud shading) with single light source
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          color
// matrixModelView              vertexNormal
// matrixModelViewProjection
// lightPosition
// lightColor
// lightAttenuations
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-02-01
// UPDATED: 2023-03-24
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// varying variables from vertex shader
varying vec4 color;

void main(void)
{
    gl_FragColor = color;
}
