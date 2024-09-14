import {GLSLHighlighter} from "@/app/components/glslHighlighter";

import "./editor.css";

export function ShaderCodeEditor({mainCode, setMainCode, headerCode}: {
    mainCode: string;
    setMainCode: (mainCode: string) => void;
    headerCode: string;
}) {
    return <div id="code-container" className="code">
        <div id="code-header">
            <GLSLHighlighter>{headerCode}</GLSLHighlighter>
        </div>
        <div id="code-editor">
            <div id="code-overlay">
                <GLSLHighlighter>{mainCode}</GLSLHighlighter>
            </div>
            <textarea id="code-input"
                      spellCheck="false"
                      value={mainCode} onChange={e => setMainCode(e.target.value)}></textarea>
        </div>
    </div>
}