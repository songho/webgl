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
varying vec3 positionVec;   // vertex position in eye space
varying vec3 normalVec;
varying vec3 viewVec;
varying vec3 lightVecs[MAX_LIGHTS];
varying float lightDistances[MAX_LIGHTS];

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);
    vec3 view = normalize(viewVec);

    // start with ambient
    vec3 color = materialAmbient.xyz;

    // apply texture before specular
    //color *= texture2D(map0, texCoord0).rgb;

    vec3 light;
    vec3 attFact;           // light attenuation factor (1, d, d*d)
    float attenuation;      // computed light attenuation

    for(int i = int(ZERO); i < MAX_LIGHTS; i++)
    {
        if(i >= lightCount)
            break;

        if(lightPositions[i].w == ZERO)
        {
            light = lightPositions[i].xyz;  // assume lightPosition is normalized
            attenuation = ONE;              // 1 for directional light
        }
        else
        {
            // compute distance
            vec3 lv = lightPositions[i].xyz - positionVec;

            // compute light attenuation: 1 / (k0 + k1*d + k2*d*d)
            attFact.x = ONE;                                    // 1
            attFact.z = dot(lv, lv);                            // dist * dist
            attFact.y = sqrt(attFact.z);                        // dist
            attenuation = ONE / dot(lightAttenuations[i], attFact);

            // re-normalize light vector
            //light = normalize(lightVecs[i]);
            light = normalize(lv);
        }

        // add diffuse portion using Lambert cosine law
        float dotNL = max(dot(normal, light), ZERO);
        color += dotNL * materialDiffuse.xyz * lightColors[i].xyz * attenuation;

        // add specular portion
        vec3 reflectVec = reflect(-light, normal); // compute reflected ray vector
        float dotVR = max(dot(view, reflectVec), ZERO);
        color += pow(dotVR, materialShininess) * materialSpecular.xyz * lightColors[i].xyz * attenuation;
    }

    // set frag color
    gl_FragColor = vec4(color, materialDiffuse.a);  // keep alpha as original material has
}
