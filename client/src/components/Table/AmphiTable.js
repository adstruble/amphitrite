import {
    Body,
    Cell,
    Header,
    HeaderCell,
    HeaderRow,
    Table,
    Row,
    useCustom
} from '@table-library/react-table-library/table';
import React, {useState} from "react";

import fetchData from "../../server/fetchData";
import useToken from "../App/useToken";
import {useTheme} from "@table-library/react-table-library/theme";
import {getTheme} from "@table-library/react-table-library/baseline";
import PropTypes from "prop-types";
import {Input, InputGroup, InputGroupText} from "reactstrap";
import AmphiHeaderCell from "./AmphiHeaderCell";
import classnames from "classnames";
import AmphiPagination from "./AmphiPagination";

const getExpandedDefault = () => {
    return (<tr className='expanded-row-contents'><td style={{display:"none"}}/></tr>);
}

export default function AmphiTable({getTableDataUrl,
                                       reloadData,
                                       headerDataStart,
                                       getExpandedRow=getExpandedDefault,
                                       includePagination=true}){
    const {token, setToken, getUsername} = useToken();
    const [headerData, setHeaderData] = useState(headerDataStart);
    const [filterFocus, setFilterFocus] = useState(false);
    const [filter, setFilter] = useState("");
    const [tableSize, setTableSize] = useState(0);
    const [currElementCnt, setCurrElementCnt] = useState(0);
    const [currPage, setCurrPage] = useState(0)
    const LIMIT = 20;

    const [tableNodes, setTableNodes] = useState({
        nodes: [],
    });

    const [ids, setIds] = React.useState([]);

    const handleExpand = (item) => {
        if (ids.includes(item.id)) {
            setIds(ids.filter((id) => id !== item.id));
        } else {
            setIds(ids.concat(item.id));
        }
    };

    useCustom("expand", tableNodes, {
        state: { ids },
        onChange: onExpandChange,
    });

    function onExpandChange(action, state) {
        console.log(action, state);
    }

    function updateOrderBy(clickedHeader){
        const newHeaders =
        headerData.map((header) => {
            if (header.key === clickedHeader.key){
                if(header.order_direction === "ASC"){
                    header.order_direction = "DESC";
                }else{
                    header.order_direction = "ASC";
                }
                header.order = 1;
                return header;
            }else{
                if(header.order <= clickedHeader.order){
                    header.order = header.order + 1;
                }
                return header;
            }
        });
        setHeaderData(newHeaders);
        setCurrPage(0)
        doGetTableData().then();
    }

    const determineOrderBy = () => {
        // Clone the headerData so we don't change the order of the columns in the rendered table,
        // Shouldn't need to do a deep copy because we're not changing data on the headers themselves
        const headerDataClone = headerData.slice(0);
        const sortedHeaders = (headerDataClone.sort((a, b) => {
            return a.order < b.order ? -1 : a.order === b.order ? 0 : 1;
        }));
        let newOrderBy = [];
        newOrderBy = sortedHeaders.reduce((newOrderBy, header) => {
            if (header.order > 0 && header.order_direction) {
                newOrderBy = newOrderBy.concat(header.order_by + "," + header.order_direction);
            }
            return newOrderBy;
        }, newOrderBy);

        return newOrderBy
    }

    const doGetTableData = React.useCallback(async () => {
        console.log("Getting table data")
        const newOrderBy = determineOrderBy()
        console.log(currPage)
        fetchData(getTableDataUrl, getUsername(),  {
            offset: currPage * LIMIT,
            limit: LIMIT,
            order_by: newOrderBy,
            return_size: true,
            filter: filter
        }, setTableData);
    }, [fetchData, filter, currPage]);

    const setTableData = (tableData, params) => {
        setTableNodes({nodes: tableData['data']});
        console.error("table size: " + tableData['size'])
        setTableSize(tableData['size']);
        if (tableData['size'] <= (params.offset + LIMIT)){
            setCurrElementCnt(tableData['size'])
        }else{
            setCurrElementCnt(params.offset + LIMIT)
        }
    };


    React.useEffect(() => {
        doGetTableData().then();
    }, [doGetTableData, reloadData]);

    const  maybeFilterTable = (e) => {
        setCurrPage(0)
        if (e.key !== 'Enter'){
            return;
        }
        doGetTableData().then();
    }

    const THEME = {
        Row: `
        &.table_row {
            background-color: (0,0,0,0);
        }
      `, Table: `--data-table-library_grid-template-columns: `
             + headerData.map((header) => {
                 if (header.width) {
                     return "minmax(0px, " + header.width + ")";
                 }else {
                     return "minmax(0px, 1fr)";
                 }
                 }).join("") + ` !important`,
    };

    const theme = useTheme([THEME, getTheme()]);

    function onPaginationChange(action, state) {
        setCurrPage(state.page)
        doGetTableData().then();
    }


    return (
        <div className='amphi-table-container'>
            <div className='amphi-table-header'>
               ` <InputGroup
                    className={classnames({
                        "input-group-focus": filterFocus
                    })}
                >
                    <div className="input-group-prepend">
                        <InputGroupText>
                            <i className="tim-icons icon-zoom-split" />
                        </InputGroupText>
                    </div>
                    <Input
                        placeholder="Filter"
                        type="text"
                        onFocus={() => setFilterFocus(true)}
                        onBlur={() => setFilterFocus(false)}
                        onChange={e => setFilter(e.target.value)}
                        onKeyUp={e => {maybeFilterTable(e)}
                        }
                    />
                </InputGroup>
                {includePagination && <AmphiPagination LIMIT={LIMIT} tableNodes={tableNodes} onPaginationChange={onPaginationChange}
                tableSize={tableSize} currPage={currPage} currElementCnt={currElementCnt}/>}
            </div>
            <div
                style={{
                    height: "100vh",
                    width: "100%",
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                }}
            >
                <div
                    style={{
                        flex: "1",
                        display: "flex",
                        flexDirection: "column",
                        position: "absolute",
                        top: "0",
                        left: "0",
                        right: "0",
                        bottom: "0",
                    }}
                >
                    <Table data={{nodes: headerData}} style={{marginBottom: "0px"}}  theme={theme} >
                        {(headerData) => (
                            <>
                                <Header>
                                    <HeaderRow className='table-row'>
                                        {headerData.map((header) => {
                                            return(<AmphiHeaderCell header={header} updateOrderBy={updateOrderBy}/>);
                                        })
                                        }
                                    </HeaderRow>
                                </Header>
                            </>
                        )}
                    </Table>
                </div>
                <div className='amphi-table-contents'>
                        <Table data={tableNodes} theme={theme}>
                        {(tableList) => (
                            <>
                                <Header>
                                    <HeaderRow style={{display:'none'}}>
                                        {headerData.map(() => {return <HeaderCell/>})}
                                    </HeaderRow>
                                </Header>

                                <Body>
                                    {tableList.map((item) => (
                                        <React.Fragment key={item.id}>
                                            <Row className={classnames({'expanded': ids.includes(item.id) }, 'table-row')}
                                                 key={item.id} item={item} onClick={handleExpand}>
                                                {headerData.map((header) => {
                                                    let txt = () => {return(header['format_fn'](item[header.key], item, header.format_args))};
                                                    return (
                                                    <Cell key={item.id + header.key}>{txt()}</Cell>);})
                                                }
                                            </Row>
                                            {ids.includes(item.id) && (getExpandedRow(item.id))}
                                        </React.Fragment>
                                    ))}
                                    <Row key='bottom' item={null}>
                                        <Cell key='bottom-cell' className='table-bottom' gridColumnStart={1} gridColumnEnd={headerData.length + 1}>&nbsp;</Cell>
                                    </Row>
                                </Body>
                            </>
                        )}
                    </Table>
                </div>
            </div>
        </div>
    );

}

AmphiTable.propTypes = {
    getTableDataUrl: PropTypes.string.isRequired,
    reloadData: PropTypes.any,
    headerDataStart:PropTypes.array.isRequired,
    getExpandedRow: PropTypes.func,
    includePagination: PropTypes.bool
}