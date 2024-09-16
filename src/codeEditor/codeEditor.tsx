import {ReactNode} from "react";
import {GLSLHighlighter} from "@/app/components/glslHighlighter";

import "./codeEditor.css"

type Highlighter = (props: { children: string, errors: Map<number, string[]> }) => ReactNode;


export function CodeEditor({src, setSrc, errors, Highlighter}: {
    src: string;
    setSrc: (code: string) => void;
    errors: Map<number, string[]>,
    Highlighter: (props: { children: string, errors: Map<number, string[]> }) => ReactNode
}) {
    return <div className="code-editor">
        <div className="code-overlay">
            <Highlighter errors={errors}>{src}</Highlighter>
        </div>
        <textarea className="code-input"
                  spellCheck="false"
                  value={src} onChange={e => setSrc(e.target.value)}/>
    </div>
}