///////////////////////////////////////////////////////////////////////////////
// gles_positionalLights.frag
// ==========================
// multiple positional lighting shader
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection                            viewVec
// lightPosition
// lightColor
// lightAttenuations
// lightCount
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2015-05-15
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;
const int   MAX_LIGHTS = 8;

// uniforms
uniform mediump int lightCount;
uniform vec4 lightColors[MAX_LIGHTS];
uniform vec4 lightPositions[MAX_LIGHTS];
uniform vec3 lightAttenuations[MAX_LIGHTS];
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
//uniform sampler2D map0;                 // texture map #1

// varying variables
varying vec3 normalVec;                 // normal vector in eye space
varying vec3 positionVec;               // vertex position in eye space
//varying vec2 texCoord0;                 // texture coords

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 view = normalize(-positionVec);

    // compute normalized view vector

    // start with ambient
    vec3 color = materialAmbient.xyz;

    for(int i = int(ZERO); i < MAX_LIGHTS; i++)
    {
        if(i >= lightCount)
            break;

        // compute light vector (from vertex to light) and distance
        // assume light position is defined in eye space
        vec3 light;
        float attenuation;
        if(lightPositions[i].w == ZERO)
        {
            light = lightPositions[i].xyz;  // assume lightPosition is normalized
            attenuation = ONE;              // 1 for directional light
        }
        else
        {
            light = lightPositions[i].xyz - positionVec;

            // compute light attenuation: 1 / (k0 + k1*d + k2*d*d)
            vec3 attFact;
            attFact.x = ONE;                // 1
            attFact.z = dot(light, light);  // dist * dist
            attFact.y = sqrt(attFact.z);    // dist
            attenuation = ONE / dot(lightAttenuations[i], attFact);

            light = normalize(light);
        }

        // compute reflected ray vector in eye space: 2 * N * (N dot L) - L
        vec3 reflect = reflect(-light, normal);

        // add diffuse portion using Lambert cosine law
        float dotNL = max(dot(normal, light), ZERO);
        color += dotNL * materialDiffuse.xyz * lightColors[i].xyz * attenuation;

        // add specular portion
        float dotVR = max(dot(view, reflect), ZERO);
        color += pow(dotVR, materialShininess) * materialSpecular.xyz * lightColors[i].xyz * attenuation;
    }

    // apply texture
    //color *= texture2D(map0, texCoord0).rgb;

    // set frag color
    gl_FragColor = vec4(color, materialDiffuse.a);  // keep alpha as original material has
}
