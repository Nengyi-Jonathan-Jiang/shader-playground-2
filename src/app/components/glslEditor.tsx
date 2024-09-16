import {GLSLHighlighter} from "@/app/components/glslHighlighter";

import "./glslEditor.css";
import {CodeEditor} from "@/codeEditor/codeEditor";

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

    return <div id="code-container" className="code">
        <div id="code-header">
            <GLSLHighlighter errors={headerCodeErrors}>{headerCode}</GLSLHighlighter>
        </div>
        <div id="code-body">
            <CodeEditor src={mainCode} setSrc={setMainCode} errors={mainCodeErrors} Highlighter={GLSLHighlighter}/>
        </div>
    </div>
}