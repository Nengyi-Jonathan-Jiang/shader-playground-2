import React, {ReactNode} from "react";
import {useManualRerender} from "@/util/hooks";
import {Tabs} from "@/tabs/tabs";
import "./uniformsEditor.css"
import {CodeEditor} from "@/codeEditor/codeEditor";
import {JSHighlighter} from "@/app/components/jsHighlighter";
import {ShaderCanvas, ShaderCanvasUniformType, ShaderCanvasUniformTypeMap} from "@/app/webgl/ShaderCanvas";
import {Select} from "@/util/select";
import {evalStatementsInContext} from "@/eval/eval";

export class CustomUniformData {
    private static nextID: number = 0;

    public name: string;
    public type: ShaderCanvasUniformType;
    public initSrc: string;
    public periodicSrc: string;
    public editable: boolean;
    public id: any = CustomUniformData.nextID++;

    public shaderUniformCallback: ShaderUniformCallback | null = null;

    constructor(
        name: string,
        type: ShaderCanvasUniformType = 'float',
        initSrc: string = '// Initialization code here...',
        periodicSrc: string = '    return 0;',
        editable = true
    ) {
        this.name = name;
        this.type = type;
        this.initSrc = initSrc;
        this.periodicSrc = periodicSrc;
        this.editable = editable;
    }

    private get combinedSource() {
        return `${
            this.initSrc
        }\nregisterUniform("${
            this.name
        }", "${
            this.type
        }", (canvas, time, mousePosition, mouseButtons) => {\n${
            this.periodicSrc
        }\n});`
    }

    evaluateSource() {
        try {
            evalStatementsInContext(this.combinedSource, {
                registerUniform: (
                    _: any,
                    __: any,
                    callBack: ShaderUniformCallback
                ) => {
                    this.shaderUniformCallback = callBack;
                },
                ...Math
            });
        } catch (e) {
            console.error(e);
            alert(`Error running uniform code for "${this.name}" :\n${e}`);
            this.shaderUniformCallback = null;
        }
    }
}

type ShaderUniformCallback = (
    canvas: ShaderCanvas,
    time: number,
    mousePosition: readonly [number, number],
    mouseButtons: number
) => ShaderCanvasUniformTypeMap[ShaderCanvasUniformType];

export class UniformEditor {
    private readonly uniforms: CustomUniformData[];

    constructor() {
        this.uniforms = [];
    }

    addDirect(uniform: CustomUniformData) {
        this.uniforms.push(uniform);
    }

    addNew(): number | null {
        const uniform = new CustomUniformData('', 'float', '', '    return 0;');
        uniform.name = `var${uniform.id}`;

        this.uniforms.push(uniform);
        return uniform.id;
    }

    deleteTab(tabID: number): boolean {
        const deletedTabIndex = this.uniforms.findIndex(({id}) => id === tabID);
        if (deletedTabIndex === -1) return false;
        this.uniforms.splice(deletedTabIndex, 1);
        return true;
    }

    get data() {
        return this.uniforms;
    }

    static Renderer({editor, rerenderParent}: {
        editor: UniformEditor,
        rerenderParent?: () => void
    }): ReactNode {
        const rerender = (rerender => () => {
            (rerenderParent ?? rerender)();
        })(useManualRerender());

        return <>
            <Tabs tabs={editor.uniforms.map(data => ({
                name: data.name,
                deletable: data.editable,
                id: data.id,
                node: <UniformsEditorTab data={data} rerender={rerender}/>
            }))} addTab={() => {
                const addedTab = editor.addNew();
                if (addedTab !== null) {
                    rerender();
                }
                return addedTab;
            }} deleteTab={(tabID) => {
                if (editor.deleteTab(tabID)) {
                    rerender();
                }
            }}/>
        </>;
    }
}

function UniformsEditorTab({data, rerender}: {
    data: CustomUniformData,
    rerender: () => void
}): ReactNode {
    return <div className="uniforms-editor-tab-content" data-disabled={data.editable ? null : ""}>
        <div className="uniforms-editor-tab-top">
            <span><span>Name: </span>
                {
                    data.editable ? (
                        <input value={data.name} onChange={({target: {value}}) => {
                            data.name = value.replaceAll(/\W/g, '');
                            rerender();
                        }} onBlur={() => {
                            if (data.name.length === 0) {
                                data.name = 'var' + data.id;
                                rerender();
                            }
                        }} spellCheck={false}/>
                    ) : <input value={data.name} readOnly tabIndex={-1}/>
                }
            </span>
            <span>Type:&nbsp;</span>
            <span className="uniform-type-select">
                <Select onChange={(value) => {
                    console.log(value);
                    data.type = value;
                    rerender();
                }} disabled={!data.editable} value={data.type} options={[
                    "float", "int", "vec2", "ivec2", "vec3", "vec4",
                    "mat2", "mat3", "mat4"
                ] as ShaderCanvasUniformType[]}/>
            </span>
            {
                data.editable ? <button onClick={() => data.evaluateSource()}>{"Run |>"}</button> : null
            }
        </div>
        <div className='js'>
            {
                data.editable ? (
                    <CodeEditor value={data.initSrc} setValue={(value) => {
                        data.initSrc = value;
                        rerender();
                    }} Highlighter={JSHighlighter}/>
                ) : (
                    <JSHighlighter value={data.initSrc}/>
                )
            }

            <JSHighlighter value={
                `registerUniform("${data.name}", "${data.type}", (canvas, time, mousePosition, mouseButtons) => {`
            }/>
            <div>
                {
                    data.editable ? (
                        <CodeEditor value={data.periodicSrc} setValue={(value) => {
                            data.periodicSrc = value;
                            rerender();
                        }} Highlighter={JSHighlighter}/>
                    ) : (
                        <JSHighlighter value={data.periodicSrc}/>
                    )
                }
            </div>
            <JSHighlighter value='});'/>
        </div>
    </div>
}
