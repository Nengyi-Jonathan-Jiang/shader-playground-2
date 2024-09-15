import {GLSLHighlighter} from "@/app/components/glslHighlighter";

import "./editor.css";

export function ShaderCodeEditor({mainCode, setMainCode, headerCode, errors}: {
    mainCode: string;
    setMainCode: (mainCode: string) => void;
    headerCode: string;
    errors: Map<number, string[]>
}) {
    const headerCodeErrors = new Map<number, string[]>;
    const mainCodeErrors = new Map<number, string[]>;

    const numHeaderCodeLines = [...headerCode.matchAll(/\n/g)].length + 1;
    for (const [line, lineErrors] of errors ?? new Map) {
        if (line < numHeaderCodeLines) {
            headerCodeErrors.set(line, lineErrors);
        } else {
            mainCodeErrors.set(line - numHeaderCodeLines, lineErrors);
        }
    }


    console.log(errors, headerCodeErrors, mainCodeErrors);

    return <div id="code-container" className="code">
        <div id="code-header">
            <GLSLHighlighter errors={headerCodeErrors}>{headerCode}</GLSLHighlighter>
        </div>
        <div id="code-editor">
            <div id="code-overlay">
                <GLSLHighlighter errors={mainCodeErrors}>{mainCode}</GLSLHighlighter>
            </div>
            <textarea id="code-input"
                      spellCheck="false"
                      value={mainCode} onChange={e => setMainCode(e.target.value)}></textarea>
        </div>
    </div>
}