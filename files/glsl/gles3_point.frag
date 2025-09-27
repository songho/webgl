#version 300 es

///////////////////////////////////////////////////////////////////////////////
// gles3_point.frag
// ================
// Shader for 2D/3D points
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2025-09-26
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 color;           // point color

// output
out vec4 fragColor;

void main(void)
{
    // distance from the center to point fragment [0,1]
    // make the point round
    float distance = distance(gl_PointCoord, vec2(0.5));
    if(distance > 0.5)
        discard;

    //vec2 dist = gl_PointCoord - vec2(0.5);
    //if(dist.x > 0.5 || dist.y > 0.5)
    //    discard;

    // Hermite interpolation of edge1 < dist < edge2 to 0 to 1
    float alpha = 1.0 - smoothstep(0.45, 0.55, distance);

    fragColor = alpha * vec4(color.r, color.g, color.b, color.a);
}
