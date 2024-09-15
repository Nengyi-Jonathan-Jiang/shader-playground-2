"use client"

import "./page.css";
import React, {useEffect, useRef, useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {InputsEditor} from "@/app/components/inputsEditor";
import {ShaderCodeEditor} from "@/app/components/editor";
import {ShaderCanvas} from "@/app/webgl/ShaderCanvas";
import {Tabs} from "@/tabs/tabs";
import {useManualRerender} from "@/util/hooks";

function JSCodeEditor() {
    const {current: tabs} = useRef([
        {
            name: "Thing",
            node: <h1>Thing</h1>
        },
        {
            name: "Thing2",
            deletable: false,
            node: <h1>Thing2</h1>
        },
        {
            name: "Thing3",
            node: <h1>Thing3</h1>
        },
    ]);
    const rerender = useManualRerender();

    return <>
        <Tabs tabs={tabs} addTab={() => {
            const name = prompt('Enter tab name')?.trim();
            if (name === undefined || name.length === 0) {
                alert('Invalid tab name');
                return null;
            }

            tabs.push({
                name,
                node: <h1>{name}</h1>
            });
            rerender();
            return name;
        }} deleteTab={(tabName) => {
            const deletedTabIndex = tabs.findIndex(({name}) => name === tabName);
            tabs.splice(deletedTabIndex, 1);
            rerender();
        }}></Tabs>
    </>;
}

export default function Home() {
    const [mainCode, setMainCode] = useState(`
void main(){
    fragColor = vec4(0.5 + 0.5 * cos(fragCoord.xyx + vec3(0,2,4)), 1.0);
}
    `.trim());
    const [headerCode, setHeaderCode] = useState(`
#version 300 es
precision mediump float;
in vec2 fragCoord;
out vec4 fragColor;

uniform float elapsedTime;

// Main code
    `.trim());

    const [shaderCanvas] = useState(() => new ShaderCanvas());

    shaderCanvas.setProgram(
        `#version 300 es
        layout (location = 0) in vec2 a_position;
        uniform float aspectRatio;
        out vec2 fragCoord;
        
        void main(){
            gl_Position = vec4(a_position, 1.0, 1.0);
            fragCoord = vec2(aspectRatio, 1.0) * a_position;
        }
    `, headerCode + '\n' + mainCode);

    const currentTime = useRef(0);
    useEffect(() => {
        currentTime.current = 0;
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
                    <div id='left'>
                        <InputsEditor setHeaderCode={setHeaderCode}/>
                        <ShaderCodeEditor
                            mainCode={mainCode}
                            setMainCode={setMainCode}
                            headerCode={headerCode}
                            errors={errors}
                        />
                        <div id="compile-button-container">
                            <button id="compile-button" data-error={
                                shaderCanvas.hasError ? '' : undefined
                            }> COMPILE CODE
                            </button>
                        </div>
                    </div>
                } bottom={
                    <JSCodeEditor/>
                }/>
            } right={
                <div id="canvas-container">
                    <ShaderCanvas.Renderer canvas={shaderCanvas} getUniforms={(canvas, deltaTime) => {
                        return [
                            {
                                name: "elapsedTime",
                                type: "float",
                                value: (currentTime.current += deltaTime)
                            }
                        ];
                    }}/>
                </div>
            }/>
        </div>
    );
}
