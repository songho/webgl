///////////////////////////////////////////////////////////////////////////////
// gles_sprite.frag
// ================
// Shader for 2D/3D points
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-10-25
// UPDATED: 2013-10-25
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// uniforms
uniform vec4 color;           // point color

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

    // Hermite interpolation of edge1 < x < edge2 to 0 to 1
    //float alpha = 1.0 - smoothstep(0.45, 0.5, distance);

    gl_FragColor = vec4(color.r, color.g, color.b, color.a);
}
