import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    useReactTable,
    getCoreRowModel,
    flexRender
} from '@tanstack/react-table';
import RequestRow from './RequestRow';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

/**
 * Virtualized & Polling LiveRequestsTable
 */
export default function LiveRequestsTable({
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isPolling,
    onManualSync,
    onRowAction,
    onViewDetails
}) {
    const parentRef = useRef(null);
    const [rowSelection, setRowSelection] = useState({});

    // Define minimal columns for Tanstack (we actually render using RequestRow, 
    // but tanstack helps with selection/sorting state if needed)
    const columns = useMemo(() => [
        { id: 'select', header: 'Select' },
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'applicant_name', header: 'Applicant' },
        { accessorKey: 'priority', header: 'Priority' },
        { accessorKey: 'status', header: 'Status' },
        { id: 'actions', header: 'Actions' }
    ], []);

    const table = useReactTable({
        data: data || [],
        columns,
        state: { rowSelection },
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getRowId: row => row.id
    });

    const { rows } = table.getRowModel();

    // Virtualization
    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? rows.length + 1 : rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80, // pixels per row
        overscan: 5
    });

    // Infinite scroll trigger
    useEffect(() => {
        const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
        if (!lastItem) return;

        if (lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, fetchNextPage, rows.length, isFetchingNextPage, rowVirtualizer.getVirtualItems()]);

    const handleToggleSelect = (id) => {
        setRowSelection(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = {};
            rows.forEach(r => allIds[r.id] = true);
            setRowSelection(allIds);
        } else {
            setRowSelection({});
        }
    };

    const selectedCount = Object.values(rowSelection).filter(Boolean).length;

    return (
        <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Table Header/Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={selectedCount > 0 && selectedCount === rows.length}
                        ref={input => {
                            if (input) input.indeterminate = selectedCount > 0 && selectedCount < rows.length;
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                        title="Select All Loaded"
                    />
                    <div className="text-sm font-bold text-slate-700">
                        {selectedCount > 0 ? `${selectedCount} Selected` : 'Requests Directory'}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedCount > 0 && (
                        <div className="flex gap-2 mr-4 border-r border-slate-200 pr-4 animate-in fade-in">
                            <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-lg transition-colors">Bulk Approve</button>
                            <button className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition-colors">Bulk Reject</button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        {isPolling && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live
                            </span>
                        )}
                        <button
                            onClick={onManualSync}
                            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"
                            title="Force Sync Now"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Column Headers (CSS Grid for alignment with rows) */}
            <div className="hidden md:flex w-full px-4 sm:px-6 py-2 bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-[32px] pl-1"></div> {/* Checkbox padding */}
                <div className="w-1/4 pr-4">Request ID</div>
                <div className="w-1/4 pr-4">Applicant Profile</div>
                <div className="w-1/6 pr-4">Priority & SLA</div>
                <div className="w-1/6 pr-4">Status</div>
                <div className="flex-1 text-right">Rapid Actions</div>
            </div>

            {/* Virtualized Body */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto custom-scrollbar relative"
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-bold">Fetching Live Directory...</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                        <p className="font-bold">No requests match current filters.</p>
                    </div>
                ) : (
                    <div
                        style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
                    >
                        {rowVirtualizer.getVirtualItems().map(virtualRow => {
                            const isLoaderRow = virtualRow.index > rows.length - 1;
                            const row = rows[virtualRow.index];

                            return (
                                <div
                                    key={virtualRow.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`
                                    }}
                                >
                                    {isLoaderRow ? (
                                        <div className="flex justify-center items-center h-full text-slate-400 text-xs font-bold gap-2">
                                            <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                                            Loading more...
                                        </div>
                                    ) : (
                                        <RequestRow
                                            request={row.original}
                                            isSelected={!!rowSelection[row.id]}
                                            toggleSelect={handleToggleSelect}
                                            onAction={onRowAction}
                                            onViewDetails={onViewDetails}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Pagination Stats */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Displaying {rows.length} loaded requests</span>
                {isFetchingNextPage && <span className="animate-pulse">Fetching...</span>}
            </div>

        </div>
    );
}
