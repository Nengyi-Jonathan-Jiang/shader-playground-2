import React from "react";

class ShaderCanvasUniformsInput {
    private coordinateAttributeName: string = 'fragCoord';
    private otherAttributes = [];
}

export function InputsEditor({setHeaderCode}: {
    setHeaderCode: (value: string) => void
}) {


    return <div id="edit-inputs">
        <div id="edit-inputs-inner">
            <div id="input-editors-container">
                <table id="input-editors">
                    <tbody>
                    <tr>
                        <th>Input Type</th>
                        <th>Variable Name</th>
                    </tr>
                    <tr>
                        <td><select className="input-type-select">
                            <option className="input-type-option">Fragment Position &nbsp; &nbsp;</option>
                        </select></td>
                        <td><input spellCheck="false" className="name-enter" type="text" value="fragCoord" readOnly/>
                        </td>
                    </tr>
                    <tr>
                        <td><span className="select-placeholder" data-value="MousePos"></span></td>
                        <td><input spellCheck="false" className="name-enter" type="text"
                                   value="mouseCoords" readOnly/></td>
                    </tr>
                    <tr>
                        <td><span className="select-placeholder" data-value="Time"></span></td>
                        <td><input spellCheck="false" className="name-enter" type="text" value="iTime" readOnly/>
                        </td>
                    </tr>
                    <tr>
                        <td><span className="select-placeholder" data-value="CurrDate"></span></td>
                        <td><input spellCheck="false" className="name-enter" type="text" value="iDate" readOnly/>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <div id="add-input-container">
                <button id="add-input">+</button>
            </div>
        </div>
    </div>;
}