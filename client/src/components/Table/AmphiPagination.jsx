import {Pagination, PaginationItem, PaginationLink} from "reactstrap";
import React from "react";

import {usePagination} from "@table-library/react-table-library/pagination";

export default function AmphiPagination({LIMIT, tableNodes, onPaginationChange, tableSize, currElementCnt, currStartElementCnt, currPage, className}){

    const includeArrows = currPage * LIMIT + 1 > 1 || currElementCnt < tableSize;
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
        <Pagination className={className}>
            <PaginationItem >
                <span className='item-count'>{currStartElementCnt}-{currElementCnt} of {tableSize}</span>
            </PaginationItem>
            {includeArrows &&
                <PaginationItem disabled={pagination.state.page === 0}>
                    <PaginationLink onClick={() => pagination.fns.onSetPage(pagination.state.page - 1)}>
                        <span aria-hidden={true}>
                            <i aria-hidden={true} className="tim-icons icon-minimal-left"/>
                        </span>
                    </PaginationLink>
                </PaginationItem>
            }
            {includeArrows &&
                <PaginationItem disabled={tableSize <= (pagination.state.page + 1) * LIMIT}>
                    <PaginationLink onClick={() => pagination.fns.onSetPage(pagination.state.page + 1)}>
                        <span aria-hidden={true}>
                            <i aria-hidden={true} className="tim-icons icon-minimal-right"/>
                        </span>
                    </PaginationLink>
                </PaginationItem>
            }
        </Pagination>
    )
}