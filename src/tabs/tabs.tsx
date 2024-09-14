import React, {ReactNode} from "react";

function TabHead({name, deletable, selectSelf}: { name: string, deletable: boolean, selectSelf: () => void }) {
    return <div className='tab-head' style={{
        display: "flex",
        paddingLeft: "5px",
        paddingRight: "5px",
        marginRight: "5px",
        outline: "1px solid black",
        userSelect: "none",
    }} onClick={selectSelf}>
        {name}
        {
            deletable ? (
                <button style={{
                    marginLeft: "5px",
                    outline: "1px solid black",
                }}>
                    X
                </button>
            ) : null
        }
    </div>;
}

function NewTabButton({addTab}: { addTab: () => void }) {
    return <div className='new-tab-button'>
        <button onClick={() => addTab()}>+</button>
    </div>;
}

export function Tabs({tabs, addTab, deleteTab}: {
    tabs: {
        name: string;
        deletable?: boolean;
        node: ReactNode;
    }[],
    addTab?: () => string | null,
    deleteTab?: (tabName: string) => void
}): ReactNode {
    const [currentTabIndex, setCurrentTabIndex] = React.useState(-1);

    if (new Set(tabs.map(({name}) => name)).size < tabs.length) {
        console.warn('Warning: tabs must have unique names.');
    }

    return <div className='tabs-container' style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    }}>
        <div className='tabs-header' style={{
            display: "flex",
        }}>
            {
                tabs.map(({name, deletable}, index) => (
                    <TabHead key={name} name={name} deletable={!!deleteTab && (deletable ?? true)} selectSelf={
                        () => setCurrentTabIndex(currentTabIndex === index ? -1 : index)
                    }/>
                ))
            }
            {addTab ? <NewTabButton addTab={() => {
                const addedTabName = addTab();
                if (addedTabName === null) return;
                const newTabIndex = tabs.findIndex(({name}) => name === addedTabName);
                if (newTabIndex === -1) return;
                setCurrentTabIndex(newTabIndex);
            }}/> : null}

        </div>
        <div className='tabs-body'>
            {
                currentTabIndex !== -1 ? tabs[currentTabIndex].node : null
            }
        </div>
    </div>
}