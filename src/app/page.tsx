"use client"

import "./page.css";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {ShaderCodeEditor} from "@/app/components/glslEditor";
import {ShaderCanvas, ShaderCanvasUniformData} from "@/app/webgl/ShaderCanvas";
import {ScriptableUniformsEditor} from "@/app/components/scriptableUniformsEditor";
import {useListenerOnWindow, useManualRerender} from "@/util/hooks";
import {
    EditableScriptableUniform,
    ReadonlyScriptableUniform,
    ScriptableUniform
} from "@/app/components/scriptableUniform";
import {providedCode} from "@/app/shaderProvidedFunctions";

const vertShader = `#version 300 es
layout (location = 0) in vec2 a_position;
uniform mediump float aspectRatio;
out vec2 fragCoord;

void main(){
    gl_Position = vec4(a_position, 1.0, 1.0);
    fragCoord = vec2(1.0 / aspectRatio, 1.0) * a_position;
}`;

const defaultMainCode = `bool hasVoxelAt(ivec3 pos) {
    float x = float(pos.x) / 5.0, y = float(pos.y) / 5.0, z = float(pos.z) / 5.0;
    return sin(x) * sin(x) + sin(y) * sin(y) + sin(z) * sin(z) >= 1.5;
}

struct stepResult {
    ivec3 voxelPos;
    vec3 normal;
    vec3 newPos;
};

stepResult stepToNextVoxel(vec3 pos, vec3 direction) {
    vec3 u = (floor(1.0 + pos * sign(direction)) * sign(direction) - pos) / direction;
    float d = min(min(u.x, u.y), u.z);
    
    vec3 normal = normalize(sign(direction) * vec3(
        u.x == d ? 1 : 0, 
        u.y == d ? 1 : 0, 
        u.z == d ? 1 : 0
    ));

    pos += d * direction;
    return stepResult(
        ivec3(pos + direction * 0.000000001),
        normal,
        pos
    );
}

vec3 fog_color = vec3(0.5, 0.75, 1.0);

vec3 raycast(vec3 start, vec3 ray) {
    for(int i = 0; i < 400; i++) {
        stepResult r = stepToNextVoxel(start, ray);
        start = r.newPos;
        vec3 normal = r.normal;
        if(hasVoxelAt(r.voxelPos)) {
            vec3 d = abs(mod(start + 0.5, 1.0) - 0.5) / (1.0 - abs(normal)) / distance(cameraPos, start);
            float d2 = min(d.x, min(d.y, d.z)) * 500.;
            
            float t = d2 <= 1. ? 0.0 : 1.0;
            vec3 faceLight = vec3(0.6 + 0.4 * dot(normal, normalize(vec3(1, -2, 3))));

            vec3 color = t * faceLight;
            float fog_amount = pow(1.0 + 0.002 * distance(cameraPos, start), -4.0);

            return color * fog_amount + fog_color * (1.0 - fog_amount);
        }
    }
    return fog_color;
}

void main(){
   float cam_distance = 1.;
   vec3 ray = normalize(vec3(fragCoord, cam_distance));
   float phi = mousePosition.x * 3.14, theta = mousePosition.y * 1.5707;
   ray = ray * vec3(1, cos(theta), cos(theta)) + ray.xzy * vec3(0, sin(theta), -sin(theta));
   ray = ray * vec3(cos(phi), 1, cos(phi)) + ray.zyx * vec3(sin(phi), 0, -sin(phi));
   vec3 v = raycast(cameraPos, ray);
   fragColor = vec4(v, 1.0);
}`

const builtinUniformData = [
    new ReadonlyScriptableUniform(
        -1,
        "aspectRatio", "float",
        "// This is a built in uniform",
        "    // canvas is a {width: number, height:number} describing the current size of the output window.\n\n    return canvas.height / canvas.width",
    ),
    new ReadonlyScriptableUniform(
        -2,
        "elapsedTime", "float",
        "// This is a built in uniform\nlet startTime = -1;",
        "    // time is a number describing the current time in seconds.\n\n    if(startTime == -1) {\n        startTime = time;\n    }\n    return time - startTime;"
    ),
    new ReadonlyScriptableUniform(
        -3,
        "mousePosition", "vec2",
        "// This is a built in uniform",
        "    // mouse is a {position: [number, number], buttons: number}.\n    // The position describes the position of the mouse on the\n    // canvas in the coordinate system of the shader. If the\n    // mouse is outside the canvas, this is set to [0, 0].\n\n    return mouse.position"
    ),
    new ReadonlyScriptableUniform(
        -4,
        "mouseButtons", "int",
        "// This is a built in uniform",
        "    // mouse is a {position: [number, number], buttons: number}.\n    // buttons is an integer representing the current state of\n    // the mouse buttons as given by JavaScript's\n    // MouseEvent.buttons\n\n    return mouse.buttons"
    ),
    new EditableScriptableUniform(
        "cameraPos", "vec3",
        "// Initialization code here...\n" +
        "let pos = [0, 0, 0];\n" +
        "let lastFrameTime = 0;",
        "    let [dx, dy, dz] = [0, 0, 1];\n" +
        "    \n" +
        "    const phi = mouse.position[0] * 3.14, theta = mouse.position[1] * 1.5707;\n" +
        "\n" +
        "    [dx, dy, dz] = [dx, dy * cos(theta) + dz * sin(theta), dz * cos(theta) - dy * sin(theta)];\n" +
        "    [dx, dy, dz] = [dx * cos(phi) + dz * sin(phi), dy, dz * cos(phi) - dx * sin(phi)];\n" +
        "\n" +
        "    const elapsedTime = (time - lastFrameTime) * 10;\n" +
        "    lastFrameTime = time;\n" +
        "    \n" +
        "    if(mouse.buttons != 0) {\n" +
        "        pos = [pos[0] + dx * elapsedTime, pos[1] + dy * elapsedTime, pos[2] + dz * elapsedTime]\n" +
        "    }\n" +
        "\n" +
        "    return pos;"
    )
];
builtinUniformData.forEach(i => i.evaluateSource());

function generateHeaderCodeForUniforms(uniformsEditor: ScriptableUniformsEditor) {
    return `#version 300 es\nprecision mediump float;\nin vec2 fragCoord;\nout vec4 fragColor;\n\n${
        uniformsEditor.data.map(({name, type}) => `uniform ${type} ${name};`).join('\n')
    }\n`;
}

export default function Home() {
    const rerender = useManualRerender();

    const shaderCanvas = useMemo(() => new ShaderCanvas(), []);

    const uniformsEditor = useMemo(() => {
        const editor = new ScriptableUniformsEditor();
        for (const i of builtinUniformData) {
            editor.addDirect(i);
        }
        return editor;
    }, []);

    const [mainCode, setMainCode] = useState(defaultMainCode);
    const headerCode = generateHeaderCodeForUniforms(uniformsEditor);

    const exportCanvas = useMemo(() => (download = false) => {
        // Force a new draw to make sure the canvas doesn't get cleared before we get the download
        shaderCanvas.draw();
        shaderCanvas.canvasElement.toBlob(blob => {
            if (blob === null) {
                alert('Could not download canvas');
                return;
            }
            const dummy = document.createElement('a');
            dummy.href = URL.createObjectURL(blob);
            if (download) {
                console.log('download');
                dummy.download = 'shader_creation.png';
            }
            else {
                console.log('not download')
                dummy.target = '_blank';
            }
            dummy.click();
        })
    }, [shaderCanvas]);

    useListenerOnWindow('keydown', useMemo(() => (e: KeyboardEvent) => {
        if (!e.ctrlKey || e.key.toLowerCase() !== 'e') return;
        e.preventDefault();
        exportCanvas(e.shiftKey);
    }, []));

    // On recompile
    const startTime = useRef(-1);
    const [errors] = useState(() => new Map<number, string[]>);

    const recompile = () => {
        errors.clear();

        startTime.current = -1;
        shaderCanvas.setProgram(vertShader, headerCode + '\n' + providedCode + '\n' + mainCode);
        const numHeaderLines = headerCode.replace(/[^\n]/g, '').length + 1;
        const numBuiltinLines = providedCode.replace(/[^\n]/g, '').length + 1;

        for (let {line, message} of shaderCanvas.errors) {
            if (line >= numHeaderLines) {
                if (line >= numHeaderLines + numBuiltinLines) {
                    line -= numBuiltinLines;
                }
                else {
                    console.error(
                        `ERROR IN BUILTIN CODE @ ${line - numHeaderLines + 2}: \n${message}`
                    );
                    continue;
                }
            }

            if (!errors.has(line)) {
                errors.set(line, []);
            }
            (errors.get(line) as string[]).push(message);
        }
        rerender();
    }

    useEffect(() => {
        errors.clear();
    }, [mainCode, headerCode]);

    const getUniforms = ({canvas, currentTime, mousePosition, mouseButtonsDown}: {
        canvas: ShaderCanvas,
        currentTime: number,
        mousePosition: readonly [number, number],
        mouseButtonsDown: number
    }) => {
        if (startTime.current == -1) {
            startTime.current = currentTime;
        }

        const res: ShaderCanvasUniformData[] = [];
        uniformsEditor.data.forEach(i => {
            if (i.shaderUniformCallback !== null) {
                try {
                    const value = i.shaderUniformCallback(
                        {
                            width: canvas.width,
                            height: canvas.height,
                        }, currentTime, {
                            position: mousePosition,
                            buttons: mouseButtonsDown
                        }
                    );
                    res.push({
                        name: i.name,
                        type: i.type,
                        value
                    });
                } catch (e) {
                    return;
                }
            }
        })

        return res;
    }

    return (
        <div id="content">
            <HorizontalResizableDoublePane left={
                <VerticalResizableDoublePane top={
                    <div id='glsl-editor'>
                        <ShaderCodeEditor
                            mainCode={mainCode}
                            setMainCode={setMainCode}
                            headerCode={headerCode}
                            errors={errors}
                            buttons={[
                                <button onClick={recompile}>Run Shader</button>,
                                <button onClick={() => exportCanvas()}>Export Canvas</button>
                            ]}
                        />
                    </div>
                } bottom={
                    <ScriptableUniformsEditor.Renderer editor={uniformsEditor} rerenderParent={rerender}/>
                }/>
            } right={
                <div id="canvas-container">
                    <ShaderCanvas.Renderer canvas={shaderCanvas} getUniforms={getUniforms}/>
                </div>
            }/>
        </div>
    );
}
