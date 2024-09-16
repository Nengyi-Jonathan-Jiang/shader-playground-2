import React, {ReactNode, useRef} from "react";
import {useManualRerender} from "@/util/hooks";
import {Tab, Tabs} from "@/tabs/tabs";
import "./uniformsEditor.css"
import {CodeEditor} from "@/codeEditor/codeEditor";
import {JSHighlighter} from "@/app/components/jsHighlighter";
import {ShaderCanvasUniformTypeMap, ShaderCanvasUniformType} from "@/app/webgl/ShaderCanvas";
import {Select} from "@/util/select";

class UniformEditorData {
    private static nextID: number = 0;

    public name: string;
    public type: ShaderCanvasUniformType;
    public initSrc: string;
    public periodicSrc: string;
    public editable: boolean;
    public id: any = UniformEditorData.nextID++;

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
}

function UniformsEditorTab({data, rerender: rerenderParent}: {
    data: UniformEditorData,
    rerender: () => void
}): ReactNode {
    const rerender = useManualRerender();

    return <div>
        <div>
            <label><span>Name: </span>
                {
                    data.editable ? (
                        <input value={data.name} onChange={({target: {value}}) => {
                            data.name = value.replaceAll(/\W/g, '');
                            rerenderParent();
                        }} onBlur={() => {
                            if (data.name.length === 0) {
                                console.log('Woa');
                                data.name = 'var' + data.id;
                                rerenderParent();
                            }
                        }} spellCheck={false}/>
                    ) : <input value={data.name} readOnly/>
                }
            </label>
            <Select onChange={(value) => {
                console.log(value);
                data.type = value;
                rerender();
            }} disabled={!data.editable} value={data.type} options={[
                "float", "int", "vec2", "ivec2", "vec3", "vec4",
                "mat2", "mat3", "mat4"
            ] as ShaderCanvasUniformType[]}/>
        </div>
        <div className='js'>
            <CodeEditor src={data.initSrc} setSrc={() => void 0} errors={new Map} Highlighter={JSHighlighter}/>

            <JSHighlighter errors={new Map}>{
                `registerUniform("${data.name}", "float", (canvas, currentTime) => {`
            }</JSHighlighter>
            <CodeEditor src={data.periodicSrc} setSrc={() => void 0} errors={new Map} Highlighter={JSHighlighter}/>
            <JSHighlighter errors={new Map}>{
                '});'
            }</JSHighlighter>
        </div>
    </div>
}

export function UniformsEditor() {
    const {current: tabs} = useRef<UniformEditorData[]>([
        new UniformEditorData("Thing"),
        new UniformEditorData(
            "elapsedTime", "float",
            "let startTime = -1;",
            "    if(startTime == -1) {\n        startTime = currentTime;\n    }\n    return currentTime - startTime;",
            false
        ),
        new UniformEditorData("Thing3"),
    ]);
    const rerender = useManualRerender();

    return <>
        <Tabs tabs={tabs.map(data => ({
            name: data.name,
            deletable: data.editable,
            id: data.id,
            node: <UniformsEditorTab data={data} rerender={rerender}/>
        }))} addTab={() => {
            const name = prompt('Enter tab name')?.trim();
            if (name === undefined || name.length === 0) {
                alert('Invalid tab name');
                return null;
            }
            tabs.push(new UniformEditorData(name, 'float', '', ''));
            rerender();
            return name;
        }} deleteTab={(tabID) => {
            const deletedTabIndex = tabs.findIndex(({id}) => id === tabID);
            if (deletedTabIndex === -1) return;
            tabs.splice(deletedTabIndex, 1);
            rerender();
        }}></Tabs>
    </>;
}