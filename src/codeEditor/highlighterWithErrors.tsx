import {ReactNode} from "react";
import "./highlighterWithErrors.css"

export function HighlighterWithErrors({Highlighter, children, errors}: {
    children: string,
    errors: Map<number, string[]>,
    Highlighter: (props: { children: string }) => ReactNode
}): ReactNode {
    return <div className='code-highlighter-container'>
        <Highlighter>{children}</Highlighter>
        <div className='code-highlighter-errors'>
            {
                new Array(children.split('\n').length).fill(null).map((_, i) => {
                    const lineErrors = errors.get(i);
                    if (!lineErrors) {
                        return <span className='error-line no-errors' key={i}></span>;
                    }

                    return <span className='error-line' key={i}>
                        <div className='errors'>
                            {
                                lineErrors.map((message, i) => <span key={i}>{message}</span>)
                            }
                        </div>
                    </span>;
                })
            }
        </div>
    </div>
}