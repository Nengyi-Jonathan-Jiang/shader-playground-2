"use client"

import "./page.css";
import React, {useEffect, useRef, useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {ShaderCodeEditor} from "@/app/components/glslEditor";
import {ShaderCanvas} from "@/app/webgl/ShaderCanvas";
import {CustomUniformData, UniformEditor} from "@/app/components/uniformsEditor";
import {render} from "react-dom";
import {useManualRerender} from "@/util/hooks";

const vertShader = `#version 300 es
layout (location = 0) in vec2 a_position;
uniform mediump float aspectRatio;
out vec2 fragCoord;

void main(){
    gl_Position = vec4(a_position, 1.0, 1.0);
    fragCoord = vec2(1.0 / aspectRatio, 1.0) * a_position;
}`;

const defaultHeaderCode = `#version 300 es
precision mediump float;
in vec2 fragCoord;
out vec4 fragColor;

uniform float aspectRatio;
uniform vec2 mousePosition;
uniform int mouseButtons;
uniform float elapsedTime;

`;

const defaultMainCode = `void main(){
    fragColor = vec4(0.5 + 0.5 * cos(fragCoord.xyx + vec3(0,2,4)), 1.0);
}`


const builtinUniformData = [
    new CustomUniformData(
        "aspectRatio", "float",
        "// This is a built in uniform",
        "    return canvas.height / canvas.width",
        false
    ),
    new CustomUniformData(
        "elapsedTime", "float",
        "// This is a built in uniform\nlet startTime = -1;",
        "    if(startTime == -1) {\n        startTime = time;\n    }\n    return time - startTime;",
        false
    ),
    new CustomUniformData(
        "mousePosition", "vec2",
        "// This is a built in uniform",
        "    return mousePosition",
        false
    ),
    new CustomUniformData(
        "mouseButtons", "int",
        "// This is a built in uniform",
        "    return mouseButtons",
        false
    ),
];

export default function Home() {
    const rerender = useManualRerender();

    const [shaderCanvas] = useState(() => new ShaderCanvas());

    const [uniformsEditor] = useState(() => {
        const editor = new UniformEditor();
        for (const i of builtinUniformData) {
            editor.addDirect(i);
        }
        return editor;
    });

    const [mainCode, setMainCode] = useState(defaultMainCode);
    const headerCode = `#version 300 es\nprecision mediump float;\nin vec2 fragCoord;\nout vec4 fragColor;\n\n${
        uniformsEditor.data.map(({name, type}) => `uniform ${type} ${name};`).join('\n')
    }\n`;

    // On recompile
    const startTime = useRef(-1);
    useEffect(() => {
        startTime.current = -1;
        shaderCanvas.setProgram(vertShader, headerCode + '\n' + mainCode);
        // Apply uniforms
    }, [mainCode, headerCode]);

    const errors = new Map<number, string[]>;
    for (const {line, message} of shaderCanvas.errors) {
        if (!errors.has(line)) {
            errors.set(line, []);
        }
        (errors.get(line) as string[]).push(message);
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
                        />
                    </div>
                } bottom={
                    <UniformEditor.Renderer editor={uniformsEditor} rerenderParent={rerender}/>
                }/>
            } right={
                <div id="canvas-container">
                    <ShaderCanvas.Renderer canvas={shaderCanvas}
                                           getUniforms={({canvas, currentTime, mousePosition, mouseButtonsDown}) => {
                                               if (startTime.current == -1) {
                                                   startTime.current = currentTime;
                                               }

                                               return [
                                                   {
                                                       name: "aspectRatio",
                                                       type: "float",
                                                       value: canvas.height / canvas.width
                                                   },
                                                   {
                                                       name: "elapsedTime",
                                                       type: "float",
                                                       value: currentTime - startTime.current
                                                   },
                                                   {
                                                       name: "mousePosition",
                                                       type: "vec2",
                                                       value: mousePosition
                                                   },
                                                   {
                                                       name: "mouseButtons",
                                                       type: "int",
                                                       value: mouseButtonsDown
                                                   }
                                               ];
                                           }}/>
                </div>
            }/>
        </div>
    );
}
