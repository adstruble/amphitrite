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
import React, {Fragment, useState} from "react";

import fetchData from "../../server/fetchData";
import useToken from "../App/useToken";
import {useTheme} from "@table-library/react-table-library/theme";
import {getTheme} from "@table-library/react-table-library/baseline";
import PropTypes from "prop-types";
import {Input, InputGroup, InputGroupText, UncontrolledTooltip} from "reactstrap";
import AmphiHeaderCell from "./AmphiHeaderCell";
import classnames from "classnames";
import AmphiPagination from "./AmphiPagination";
import {onKeyupWithDelay} from "../Utils/General";

export const getExpandedDefault = () => {
    return (<tr className='expanded-row-contents'><td style={{display:"none"}}/></tr>);
}

export default function AmphiTable({tableDataUrl,
                                       reloadData,
                                       headerDataStart,
                                       getExpandedRow=getExpandedDefault,
                                       includePagination=true,
                                       fetchParams,
                                       includeSearch=true,
                                       filter=null}){
    const {getUsername} = useToken();
    const [headerCols, setHeaderCols] = useState(headerDataStart.cols);
    const [headerRows, setHeaderRows] = useState(headerDataStart.rows);
    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [search, setSearch] = useState("");
    const [tableSize, setTableSize] = useState(0);
    const [currElementCnt, setCurrElementCnt] = useState(0);
    const [currPage, setCurrPage] = useState(0);
    const [exactFilter, setExactFilter] = useState({});
    const LIMIT = 30;
    const Filter = filter;

    const [tableNodes, setTableNodes] = useState({
        nodes: [],
    });

    const [ids, setIds] = React.useState([]);

    React.useEffect(() => {
        setHeaderCols(headerDataStart.cols);
        setHeaderRows(headerDataStart.rows);
    }, [headerDataStart]);

    const handleExpand = (item, event) => {
        if (event && event.target.classList.contains('form-check-sign')){
            return;
        }
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
        //console.log(action, state);
    }

    function updateOrderBy(clickedHeader){
        const newHeaders =
        headerCols.map((header) => {
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
        setHeaderCols(newHeaders);
        setCurrPage(0)
    }

    const determineOrderBy = () => {
        // Clone the headerData so we don't change the order of the columns in the rendered table,
        // Shouldn't need to do a deep copy because we're not changing data on the headers themselves
        const headerDataClone = headerCols.slice(0);
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
        let params = {...fetchParams, ...{
                offset: currPage * LIMIT,
                limit: LIMIT,
                order_by: newOrderBy,
                return_size: true,
                like_filter: search,
                exact_filters: exactFilter
            }};
        fetchData(tableDataUrl, getUsername(), params, setTableData);
    }, [fetchData, search, currPage, fetchParams, headerCols, exactFilter]);

    const setTableData = (tableData, params) => {
        setTableNodes({nodes: tableData['data']});
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

    React.useEffect(() =>{
        setHeaderCols(headerDataStart.cols);
        setHeaderRows(headerDataStart.rows);
    }, [headerDataStart]);

    const  maybeSearchTable = (e) => {
        setSearch(e.target.value)
        setCurrPage(0)
    }

    const THEME = {
        Row: `
        &.table_row {
            background-color: (0,0,0,0);
        }
      `, Table: `--data-table-library_grid-template-columns: `
             + headerCols.map((header) => {
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

    function onApplyFilter(filterState){
        console.info("filter closed");
        setShowFilterOptions(false);
        if (!filterState) {
            return;
        }
        setExactFilter(filterState)
    }

    return (
        <div className='amphi-table-container'>

            <div className='amphi-table-search-paginate' id="amphiTableSearchPaginate">
                <div className='amphi-table-search' id="amphiTableSearch">
                {includeSearch &&
                    <InputGroup onBlur={() => setSearchFocus(false)}
                                className={classnames({"input-group-focus": searchFocus})}>
                        <div className="input-group-prepend">
                            <InputGroupText>
                                <i className="tim-icons icon-zoom-split"/>
                            </InputGroupText>
                        </div>
                        <Input
                            placeholder="Search"
                            type="text"
                            onFocus={() => setSearchFocus(true)}
                            className={classnames({"input-group-focus": searchFocus})}
                            onKeyUp={onKeyupWithDelay((e) => maybeSearchTable(e),
                                500)}
                            id={tableDataUrl + "_amphiTable"}
                        />
                        <div className="input-group-append">
                            <InputGroupText>
                                <i className="amphi-icon icon-filter clickable"
                                   style={showFilterOptions ? {display: "none"} : {}}
                                   onClick={() => {
                                       setShowFilterOptions(!showFilterOptions);
                                   }}/>
                            </InputGroupText>
                        </div>
                    </InputGroup>}

                    {Filter &&  <Filter applyFilterCallback={onApplyFilter} showFilter={showFilterOptions}/>}
                </div>


                {includePagination &&
                <AmphiPagination className={classnames('pagination')} LIMIT={LIMIT} tableNodes={tableNodes} onPaginationChange={onPaginationChange}
                                 tableSize={tableSize} currPage={currPage} currElementCnt={currElementCnt}/>}
            </div>

            <div className='amphi-table-inner'>
                <div className='amphi-table-header'>
                    <Table data={{nodes: headerCols}} style={{marginBottom: "0px"}} theme={theme} >
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
                    <Table data={tableNodes} theme={theme} >
                    {(tableList) => (
                        <>
                            <Header>
                                <HeaderRow style={{display:'none'}}>
                                    {headerCols.map(() => {return <HeaderCell/>})}
                                </HeaderRow>
                            </Header>

                            <Body>
                                {tableList.map((item) => (

                                    <React.Fragment key={item.id}>
                                        <Row className={
                                            classnames({'expanded': ids.includes(item.id) },
                                            'table-row', (headerRows.getRowClass) && headerRows.getRowClass(item))}
                                             key={item.id} item={item}>
                                            {headerCols.map((header) => {
                                                let txt = () => {return(header['format_fn'](item[header.key], item, header.format_args, handleExpand, header.key))};
                                                return (
                                                    <Cell id={'id' + item.id + header.key}
                                                          key={item.id + header.key}
                                                          className={header.className && header.className}>
                                                        {header.tooltip && <UncontrolledTooltip
                                                            placement={"top-start"}
                                                            target={'id' + item.id + header.key}>
                                                            {txt()}
                                                        </UncontrolledTooltip>}
                                                        {txt()}

                                                    </Cell>
                                                   );})
                                            }
                                        </Row>
                                        {ids.includes(item.id) && (getExpandedRow(item))}
                                    </React.Fragment>
                                ))}
                                <Row key='bottom' item={null}>
                                    <Cell key='bottom-cell' className='table-bottom' gridColumnStart={1} gridColumnEnd={headerCols.length + 1}>&nbsp;</Cell>
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
    tableDataUrl: PropTypes.string.isRequired,
    reloadData: PropTypes.any,
    headerDataStart:PropTypes.objectOf(PropTypes.any).isRequired,
    getExpandedRow: PropTypes.func,
    includePagination: PropTypes.bool,
    fetchParams: PropTypes.objectOf(PropTypes.any)
}