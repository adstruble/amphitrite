import {Body, Cell, Header, HeaderCell, HeaderRow, Table, Row} from '@table-library/react-table-library/table';
import React, {useState} from "react";

import fetchData from "../../server/post";
import useToken from "../App/useToken";
import {useTheme} from "@table-library/react-table-library/theme";
import {getTheme} from "@table-library/react-table-library/baseline";
import {usePagination} from "@table-library/react-table-library/pagination";
import PropTypes from "prop-types";
import {Pagination, PaginationItem, PaginationLink} from "reactstrap";

export default function AmphiTable({getTableDataUrl, reloadData, headerData}){
    const {token, setToken, getUsername} = useToken();
    const [tableSize, setTableSize] = useState(0);
    const [currElementCnt, setCurrElementCnt] = useState(0);
    //const [headerData, setHeaderData] = useState(headerDataStart)
    const [currPage, setCurrPage] = useState(0)
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
        doGetTableData(state.page * LIMIT).then();
    }

    function updateOrderBy(clickedHeader){
        return;
        /*let newHeaders = []
        headerData.map((header) => {
            if (header.col_key === clickedHeader.col_key){
                if(header.direction === "ASC"){
                    header.direction = "DESC";
                }else{
                    header.direction = "ASC";
                }
                newHeaders.unshift(header)
            }else{
                newHeaders.push(header)
            }
        });
        setHeaderData(newHeaders);
        doGetTableData(currPage * LIMIT).then();*/
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
        const sortedHeaders = (headerData.sort((a, b) => {
            return a.order > b.order
        }));
        let newOrderBy = [];
        newOrderBy = sortedHeaders.reduce((newOrderBy, header) => {
            if (header.order > 0) {
                newOrderBy = newOrderBy.concat(newOrderBy, header.order_by + "," + header.order_direction);
            }
            return newOrderBy;
        }, newOrderBy);

        return newOrderBy
    }

    const doGetTableData = React.useCallback(async (offset) => {
        const newOrderBy = determineOrderBy();
        fetchData(getTableDataUrl, getUsername(),  {
            offset: offset,
            limit: LIMIT,
            order_by: newOrderBy,
            return_size: true
        }, setTableData);
    }, [fetchData]);


    React.useEffect(() => {
        doGetTableData(0).then();
    }, [doGetTableData, reloadData]);


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
            <Pagination>
                <PaginationItem >
                    <span>{pagination.state.page * LIMIT + 1 }-{currElementCnt} of {tableSize}</span>
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
            <div
                style={{
                    height: "100vh",
                    width: "100%",
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    marginTop: ".5rem"
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
                                            if(header.order_by){
                                            return(<HeaderCell
                                                onClick={()=>{updateOrderBy(header)}}
                                                className="icon-minimal-up icon-minimal-down">{header.name}</HeaderCell>);
                                        }else{
                                            return(<HeaderCell>header.name</HeaderCell>)
                                        }
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
                                        <HeaderCell></HeaderCell>
                                        <HeaderCell></HeaderCell>
                                        <HeaderCell></HeaderCell>
                                        <HeaderCell></HeaderCell>
                                    </HeaderRow>
                                </Header>

                                <Body>
                                    {tableList.map((fish) => (
                                        <Row className='table-row' key={fish.id} item={fish}>
                                            <Cell>{fish.group_id}</Cell>
                                            <Cell>{fish.sex}</Cell>
                                            <Cell>{fish.tag}</Cell>
                                            <Cell>{fish.box}</Cell>
                                        </Row>
                                    ))}
                                    <Row key='bottom' item={null}>
                                        <Cell className='table-bottom' gridColumnStart={1} gridColumnEnd={5}>&nbsp;</Cell>
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
    headerData:PropTypes.any.isRequired
}