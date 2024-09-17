"use client"

import "./page.css";
import React, {useEffect, useRef, useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {InputsEditor} from "@/app/components/inputsEditor";
import {ShaderCodeEditor} from "@/app/components/glslEditor";
import {ShaderCanvas} from "@/app/webgl/ShaderCanvas";
import {UniformsEditor} from "@/app/components/uniformsEditor";

const vertShader = `#version 300 es
layout (location = 0) in vec2 a_position;
uniform mediump float aspectRatio;
out vec2 fragCoord;

void main(){
    gl_Position = vec4(a_position, 1.0, 1.0);
    fragCoord = vec2(aspectRatio, 1.0) * a_position;
}`;

const defaultHeaderCode = `#version 300 es
precision mediump float;
in vec2 fragCoord;
out vec4 fragColor;

uniform float aspectRatio;
uniform float elapsedTime;

`;

const defaultMainCode = `void main(){
    fragColor = vec4(0.5 + 0.5 * cos(fragCoord.xyx + vec3(0,2,4)), 1.0);
}`

export default function Home() {
    const [mainCode, setMainCode] = useState(defaultMainCode);
    const [headerCode, setHeaderCode] = useState(defaultHeaderCode);

    const [shaderCanvas] = useState(() => new ShaderCanvas());

    const startTime = useRef(-1);
    useEffect(() => {
        startTime.current = -1;
    }, [mainCode, headerCode]);

    shaderCanvas.setProgram(vertShader, headerCode + '\n' + mainCode);
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
                        <InputsEditor setHeaderCode={setHeaderCode}/>
                        <ShaderCodeEditor
                            mainCode={mainCode}
                            setMainCode={setMainCode}
                            headerCode={headerCode}
                            errors={errors}
                        />
                    </div>
                } bottom={
                    <UniformsEditor/>
                }/>
            } right={
                <div id="canvas-container">
                    <ShaderCanvas.Renderer canvas={shaderCanvas} getUniforms={(canvas, currentTime) => {
                        if (startTime.current == -1) {
                            startTime.current = currentTime;
                        }

                        return [
                            {
                                name: "elapsedTime",
                                type: "float",
                                value: currentTime - startTime.current
                            }
                        ];
                    }}/>
                </div>
            }/>
        </div>
    );
}
