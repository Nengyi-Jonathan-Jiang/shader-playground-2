"use client"

import "./page.css";
import React, {useEffect, useRef, useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {ShaderCodeEditor} from "@/app/components/glslEditor";
import {ShaderCanvas, ShaderCanvasUniformData} from "@/app/webgl/ShaderCanvas";
import {ScriptableUniformsEditor} from "@/app/components/scriptableUniformsEditor";
import {useManualRerender} from "@/util/hooks";
import {ReadonlyScriptableUniform} from "@/app/components/scriptableUniform";

const vertShader = `#version 300 es
layout (location = 0) in vec2 a_position;
uniform mediump float aspectRatio;
out vec2 fragCoord;

void main(){
    gl_Position = vec4(a_position, 1.0, 1.0);
    fragCoord = vec2(1.0 / aspectRatio, 1.0) * a_position;
}`;

const defaultMainCode = `void main(){
    fragColor = vec4(0.5 + 0.5 * cos(fragCoord.xyx + vec3(0,2,4)), 1.0);
}`

const builtinUniformData = [
    new ReadonlyScriptableUniform(
        -1,
        "aspectRatio", "float",
        "// This is a built in uniform",
        "    return canvas.height / canvas.width",
    ),
    new ReadonlyScriptableUniform(
        -2,
        "elapsedTime", "float",
        "// This is a built in uniform\nlet startTime = -1;",
        "    if(startTime == -1) {\n        startTime = time;\n    }\n    return time - startTime;"
    ),
    new ReadonlyScriptableUniform(
        -3,
        "mousePosition", "vec2",
        "// This is a built in uniform",
        "    return mousePosition"
    ),
    new ReadonlyScriptableUniform(
        -4,
        "mouseButtons", "int",
        "// This is a built in uniform",
        "    return mouseButtons"
    ),
];
builtinUniformData.forEach(i => i.evaluateSource());

function generateHeaderCodeForUniforms(uniformsEditor: ScriptableUniformsEditor) {
    return `#version 300 es\nprecision mediump float;\nin vec2 fragCoord;\nout vec4 fragColor;\n\n${
        uniformsEditor.data.map(({name, type}) => `uniform ${type} ${name};`).join('\n')
    }\n`;
}

export default function Home() {
    const rerender = useManualRerender();

    const [shaderCanvas] = useState(() => new ShaderCanvas());

    const [uniformsEditor] = useState(() => {
        const editor = new ScriptableUniformsEditor();
        for (const i of builtinUniformData) {
            editor.addDirect(i);
        }
        return editor;
    });

    const [mainCode, setMainCode] = useState(defaultMainCode);
    const headerCode = generateHeaderCodeForUniforms(uniformsEditor);

    // On recompile
    const startTime = useRef(-1);
    const [errors] = useState(() => new Map<number, string[]>);

    const recompile = () => {
        errors.clear();

        startTime.current = -1;
        shaderCanvas.setProgram(vertShader, headerCode + '\n' + mainCode);
        for (const {line, message} of shaderCanvas.errors) {
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
                    const value = i.shaderUniformCallback(canvas, currentTime, mousePosition, mouseButtonsDown);
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
                            recompile={recompile}
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
