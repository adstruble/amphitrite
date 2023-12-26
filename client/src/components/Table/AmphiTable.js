import {Body, Cell, Header, HeaderCell, HeaderRow, Table, Row} from '@table-library/react-table-library/table';
import React, {useState} from "react";

import fetchData from "../../server/post";
import useToken from "../App/useToken";
import {useTheme} from "@table-library/react-table-library/theme";
import {getTheme} from "@table-library/react-table-library/baseline";
import {usePagination} from "@table-library/react-table-library/pagination";
import PropTypes from "prop-types";
import {Input, InputGroup, InputGroupText, Pagination, PaginationItem, PaginationLink} from "reactstrap";
import AmphiHeaderCell from "./AmphiHeaderCell";
import classnames from "classnames";

export default function AmphiTable({getTableDataUrl, reloadData, headerDataStart}){
    const {token, setToken, getUsername} = useToken();
    const [tableSize, setTableSize] = useState(0);
    const [currElementCnt, setCurrElementCnt] = useState(0);
    const [headerData, setHeaderData] = useState(headerDataStart);
    const [currPage, setCurrPage] = useState(0);
    const [filterFocus, setFilterFocus] = useState(false);
    const [filter, setFilter] = useState("");
    const LIMIT = 20;

    const [tableNodes, setTableNodes] = useState({
        nodes: [],
    });

    const pagination = usePagination(
        tableNodes,
        {
            state: {
                page: currPage,
                size: LIMIT,
            },
            onChange: onPaginationChange,
        },
        {
            isServer: true,
        }
    );

    function onPaginationChange(action, state) {
        setCurrPage(state.page)
        doGetTableData().then();
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
        doGetTableData().then();
    }

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
        const newOrderBy = determineOrderBy()
        fetchData(getTableDataUrl, getUsername(),  {
            offset: currPage * LIMIT,
            limit: LIMIT,
            order_by: newOrderBy,
            return_size: true,
            filter: filter
        }, setTableData);
    }, [fetchData, filter, currPage]);


    React.useEffect(() => {
        doGetTableData().then();
    }, [doGetTableData, reloadData]);

    const  maybeFilterTable = (e) => {
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
      `,
    };

    const theme = useTheme([THEME, getTheme()]);

    return (
        <div className='amphi-table-container'>
            <div className='amphi-table-header'>
                <InputGroup
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
                <Pagination>
                    <PaginationItem >
                        <span className='item-count'>{currElementCnt ? pagination.state.page * LIMIT + 1 : 0 }-{currElementCnt} of {tableSize}</span>
                    </PaginationItem>
                    <PaginationItem disabled={pagination.state.page === 0}>
                        <PaginationLink onClick={() => pagination.fns.onSetPage(pagination.state.page - 1)}>
                                        <span aria-hidden={true}>
                                            <i aria-hidden={true} className="tim-icons icon-minimal-left"/>
                                        </span>
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem disabled={tableSize <= (pagination.state.page + 1) * LIMIT}>
                        <PaginationLink onClick={() => pagination.fns.onSetPage(pagination.state.page + 1)}>
                                        <span aria-hidden={true}>
                                            <i aria-hidden={true} className="tim-icons icon-minimal-right"/>
                                        </span>
                        </PaginationLink>
                    </PaginationItem>
                </Pagination>
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
                <div
                    style={{
                        flex: "1",
                        display: "flex",
                        flexDirection: "column",
                        position: "absolute",
                        inset: "45px 0px 0px 0px",
                        marginBottom: "80px"
                    }}
                >
                    <Table data={tableNodes} theme={theme} pagination={pagination}>
                        {(tableList) => (
                            <>
                                <Header>
                                    <HeaderRow style={{display:"none"}}>
                                        {headerData.map(() => {return <HeaderCell/>})}
                                    </HeaderRow>
                                </Header>

                                <Body>
                                    {tableList.map((item) => (
                                        <Row className='table-row' key={item.id} item={item}>
                                            {headerData.map((header) => {return <Cell>{item[header.key]}</Cell>})}
                                        </Row>
                                    ))}
                                    <Row key='bottom' item={null}>
                                        <Cell key='bottom-cell' className='table-bottom' gridColumnStart={1} gridColumnEnd={5}>&nbsp;</Cell>
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
    headerDataStart:PropTypes.array.isRequired
}