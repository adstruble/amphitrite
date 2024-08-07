import {Pagination, PaginationItem, PaginationLink} from "reactstrap";
import React, {useState} from "react";

import {usePagination} from "@table-library/react-table-library/pagination";

export default function AmphiPagination({LIMIT, tableNodes, onPaginationChange, tableSize, currElementCnt, currPage}){

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


    return (
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
    )
}