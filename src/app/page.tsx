"use client"

import "./page.css";
import React, {useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {InputsEditor} from "@/app/components/inputsEditor";
import {CodeEditor} from "@/app/components/editor";
import {ShaderCanvas} from "@/app/webgl/ShaderCanvas";

export default function Home() {
    const [mainCode, setMainCode] = useState(`
void main(){
    fragColor = vec4(0.5 + 0.5 * cos(fragCoord.xyx + vec3(0,2,4)), 1.0);
}
    `.trim());
    const [headerCode, setHeaderCode] = useState(`
#version 300 es
precision mediump float;
out vec4 fragColor;

in vec2 fragCoord;

// Main code
    `.trim());

    const [canvasInstance] = useState(() => new ShaderCanvas());

    canvasInstance.setProgram(
        `#version 300 es
        layout (location = 0) in vec2 a_position;
        uniform float aspectRatio;
        out vec2 fragCoord;
        
        void main(){
            gl_Position = vec4(a_position, 1.0, 1.0);
            fragCoord = vec2(aspectRatio, 1.0) * a_position;
        }
    `, `#version 300 es
        precision mediump float;
        in vec2 fragCoord;
        out vec4 fragColor;
    ` + mainCode);

    return (
        <div id="content">
            <HorizontalResizableDoublePane left={
                <VerticalResizableDoublePane top={
                    <div id='left'>
                        <InputsEditor setHeaderCode={setHeaderCode}/>
                        <CodeEditor mainCode={mainCode} setMainCode={setMainCode} headerCode={headerCode}/>
                        <div id="compile-button-container">
                            <button id="compile-button" data-error={
                                canvasInstance.hasError ? '' : undefined
                            }>COMPILE CODE
                            </button>
                        </div>
                    </div>
                } bottom={
                    <></>
                }/>
            } right={
                <div id="canvas-container">
                    <ShaderCanvas.Renderer canvas={canvasInstance} getUniforms={() => {
                        return [];
                    }}/>
                </div>
            }/>
        </div>
    );
}
