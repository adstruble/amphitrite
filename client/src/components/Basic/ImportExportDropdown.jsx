import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import React, {useState} from "react";
import classnames from "classnames";

export function ImportExportDropdown({importExportItems}) {

    const [importExportDropdownOpen, setImportExportDropdownOpen] = useState(false);

    function toggleDropdown(){
        setImportExportDropdownOpen((prevState) => !prevState);
    }

    return (
        <Dropdown label="importExportDropdown" toggle={toggleDropdown}
                  isOpen={importExportDropdownOpen}>
            <DropdownToggle style={{paddingTop: 0, paddingLeft: 0, paddingRight: '3px'}}
                            aria-expanded={false}
                            aria-haspopup={true}
                            caret
                            color="default"
                            data-toggle="dropdown"
                            id="importExportToggle"
                            nav
            >
                <span>Import/Export</span>
            </DropdownToggle>
            <DropdownMenu aria-labelledby="navbarDropdownMenuLink">
                {importExportItems.map((importExportItem, index, array) => {
                    const icon = importExportItem['export'] === true ? 'icon-download' : 'icon-upload'
                    return (<>
                        {index > 0 && !array[index - 1]['export'] && importExportItem['export'] && <DropdownItem divider/>}
                        <DropdownItem onClick={importExportItem['callback']}>
                            <i className={classnames(icon,  'amphi-icon')}
                                color="info"/>
                            <span>{importExportItem['name']}</span>
                        </DropdownItem>
                    </>)
                })}
            </DropdownMenu>
        </Dropdown>
    );
}
