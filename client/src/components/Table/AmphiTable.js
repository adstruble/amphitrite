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
    const LIMIT = 20;

    const [tableNodes, setTableNodes] = useState({
        nodes: [],
    });


    const setTableData = (tableData) => {
        setTableNodes({nodes: tableData['data']});
        setTableSize(tableData['size']);
    }

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

    const doGetTableData = React.useCallback(async (offset, desc) => {
        const newOrderBy = determineOrderBy();
        fetchData(getTableDataUrl, getUsername(),  {
            offset: offset,
            limit: LIMIT,
            order_by: newOrderBy,
            return_size: true
        }, setTableData);
    }, [fetchData]);


    React.useEffect(() => {
        doGetTableData(0, false).then();
    }, [doGetTableData, reloadData]);


    const THEME = {
        Row: `
        &.table_row {
            background-color: (0,0,0,0);
        }
      `,
    };

    const theme = useTheme([THEME, getTheme()]);

    const pagination = usePagination(
        tableNodes,
        {
            state: {
                page: 0,
                size: LIMIT,
            },
            onChange: onPaginationChange,
        },
        {
            isServer: true,
        }
    );
    function onPaginationChange(action, state) {
        doGetTableData(state.page * LIMIT, false).then();
    }

    return (
        <div className='amphi_table_container'>
            <Pagination>
                <PaginationItem disabled={pagination.state.page === 0}>
                    <PaginationLink onClick={() => pagination.fns.onSetPage(pagination.state.page - 1)}>
                                    <span aria-hidden={true}>
                                        <i aria-hidden={true} className="tim-icons icon-minimal-left"/>
                                    </span>
                    </PaginationLink>
                </PaginationItem>
                <PaginationItem disabled={pagination.state.page === tableSize}>
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
                                    <HeaderRow className='table_row'>
                                        {headerData.map((header) => (
                                            <HeaderCell>{header.name}</HeaderCell>))}
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
                                        <Row className='table_row' key={fish.id} item={fish}>
                                            <Cell>{fish.group_id}</Cell>
                                            <Cell>{fish.sex}</Cell>
                                            <Cell>{fish.tag}</Cell>
                                            <Cell>{fish.box}</Cell>
                                        </Row>
                                    ))}
                                    <Row key='bottom' item={null}>
                                        <Cell className='table_bottom' gridColumnStart={1} gridColumnEnd={5}>&nbsp;</Cell>
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