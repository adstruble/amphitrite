import PropTypes from "prop-types";

export function getCurrentTableSelection(recordType, tableSelection){
    if (tableSelection.type !== 'Range'){
        return ["error", "No table rows are selected. To select " + recordType + " for export, highlight the rows in the table you wish to export."]
    }
    const startNode = tableSelection.anchorNode;
    let trStart = _maybe_find_table_row_node(startNode);
    if(trStart == null){
        return ["error", "Contents other than table rows are selected. To select " + recordType + " for export, highlight the rows in the table you wish to export."]
    }

    const endNode = tableSelection.focusNode;
    const trEnd = _maybe_find_table_row_node(endNode);
    if(trEnd == null){
        return ["error", "Contents other than table rows are selected. To select " + recordType + " for export, highlight the rows in the table you wish to export."]
    }

    const ids = []
    while(trStart !== null){
        ids.push(trStart.id.slice(2))
        if (trStart.id === trEnd.id){
            break;
        }
        trStart = trStart.nextSibling;
    }
    return ids
}

function _maybe_find_table_row_node(node){
    try {
        let tdNode = node.parentNode.parentNode;
        if (node.nodeName === "DIV") {
            tdNode = node.parentNode;
        }
        if (tdNode.nodeName !== "TD") {
            return null;
        }
        return tdNode.parentNode;
    }catch{
        return null;
    }
}

getCurrentTableSelection.propTypes={
    recordType: PropTypes.string.isRequired
}