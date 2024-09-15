import React, {ReactNode, useEffect, useRef} from "react";
import {useAnimation} from "@/util/hooks";

interface UniformTypeMap {
    float: number,
    vec2: number[],
    vec3: number[],
    vec4: number[],
    mat2: number[],
    mat3: number[],
    mat4: number[],
}

export class ShaderCanvas {
    private program: WebGLProgram | null = null;
    readonly canvasElement: HTMLCanvasElement;
    private readonly webglContext: WebGL2RenderingContext;
    readonly errors: { line: number, message: string }[] = [];

    constructor() {
        this.canvasElement = document.createElement('canvas');
        const canvas = this.canvasElement;
        const gl = canvas.getContext("webgl2", {antialias: false});
        if (!gl) throw Error("ERROR: WEBGL NOT SUPPORTED");
        this.webglContext = gl;
        gl.clearColor(0, 0, 0, 0);

        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }

    setCanvasSize(width: number, height: number) {
        this.canvasElement.width = width;
        this.canvasElement.height = height;
        this.webglContext.viewport(0, 0, width, height);
    }

    setProgram(shaderSource: string, fragmentSource: string) {
        this.errors.splice(0, Number.POSITIVE_INFINITY);
        this.program = this.createProgramFromSources(
            this.webglContext,
            shaderSource,
            fragmentSource
        ) ?? this.program;
        this.webglContext.useProgram(this.program);
    }

    setUniform<K extends keyof UniformTypeMap>(
        name: string,
        type: K,
        data: UniformTypeMap[K]
    ) {
        if (this.program === null) return;

        const location = this.webglContext.getUniformLocation(this.program, name);
        if (location === null) return;

        switch (type) {
            case "float":
                // @ts-ignore
                return this.webglContext.uniform1f(location, data);
            case "vec2":
                // @ts-ignore
                return this.webglContext.uniform2f(location, ...data);
            case "vec3":
                // @ts-ignore
                return this.webglContext.uniform3f(location, ...data);
            case "vec4":
                // @ts-ignore
                return this.webglContext.uniform4f(location, ...data);
            case "mat2":
                // @ts-ignore
                return this.webglContext.uniformMatrix2fv(location, false, data);
            case "mat3":
                // @ts-ignore
                return this.webglContext.uniformMatrix3fv(location, false, data);
            case "mat4":
                // @ts-ignore
                return this.webglContext.uniformMatrix4fv(location, false, data);
            default:
                return;
        }
    }

    setUniforms(uniforms: {
        name: string,
        type: keyof UniformTypeMap,
        value: number | number[]
    }[]) {
        for (const {name, type, value} of uniforms) {
            this.setUniform(name, type, value);
        }
    }

    draw() {
        if (this.program === null) return;
        let a = this.canvasElement.clientWidth / this.canvasElement.clientHeight;
        this.setUniform('aspectRatio', "float", a);
        this.webglContext.clear(
            this.webglContext.COLOR_BUFFER_BIT | this.webglContext.DEPTH_BUFFER_BIT
        );
        this.webglContext.drawArrays(this.webglContext.TRIANGLES, 0, 6);
    }

    public get hasError() {
        return this.errors.length > 0;
    }

    private createShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number): WebGLShader | null {
        const shader = gl.createShader(shaderType) as WebGLShader;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const errorMessage = gl.getShaderInfoLog(shader) ?? '';

            this.errors.push(...[...errorMessage.matchAll(/ERROR:\s+0:\d+:\s+[^\n]+/g)]
                .map(i => /ERROR:\s+0:(\d+):\s+([^\n]+)/g.exec(i[0]) as RegExpExecArray)
                .map(([, line, message]) => ({
                    line: +line - 1,
                    message
                })));

            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private createProgram(gl: WebGLRenderingContext, ...shaders: WebGLShader[]): WebGLProgram | null {
        const program = gl.createProgram() as WebGLProgram;
        for (const shader of shaders) gl.attachShader(program, shader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log('Error in program linking:' + gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    private createProgramFromSources(gl: WebGLRenderingContext, vertSource: string, fragSource: string): WebGLProgram | null {
        const vertShader = this.createShader(gl, vertSource, gl.VERTEX_SHADER);
        const fragShader = this.createShader(gl, fragSource, gl.FRAGMENT_SHADER);

        if (vertShader === null || fragShader === null) {
            return null;
        }

        return this.createProgram(gl,
            vertShader,
            fragShader
        );
    }

    public static Renderer({canvas, getUniforms}: {
        canvas: ShaderCanvas,
        getUniforms: (canvas: ShaderCanvas, deltaTime: DOMHighResTimeStamp) => {
            name: string,
            type: keyof UniformTypeMap,
            value: number | number[]
        }[]
    }): ReactNode {
        const placeholderRef = useRef<HTMLDivElement>(null);
        const canvasElement = canvas.canvasElement;

        useEffect(() => {
            const placeholderElement = placeholderRef.current;
            if (placeholderElement) {
                placeholderElement.replaceWith(canvasElement);
            }
        });

        useAnimation((_, deltaTime) => {
            canvas.setCanvasSize(canvasElement.clientWidth, canvasElement.clientHeight);
            canvas.setUniforms(getUniforms(canvas, deltaTime));
            canvas.draw();
        })

        return <div ref={placeholderRef}></div>
    }
}
