import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useReducer } from 'react';
import {
  Column,
  Table,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  RowData,
} from '@tanstack/react-table';
import { TeacherTableRow } from '../types/teacher-table-row';
import { addTeacher, updateTeacher, deleteTeacher, getAllTeachers } from '../services/user-service';

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

const defaultColumn: Partial<ColumnDef<TeacherTableRow>> = {
  cell: ({ getValue, row: { index }, column: { id }, table }) => {
    const initialValue = getValue() as string;
    const [value, setValue] = useState(initialValue);
    const onBlur = () => {
      table.options.meta?.updateData(index, id, value);
    };
    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
      />
    );
  },
};

function useSkipper() {
  const shouldSkipRef = useRef(true);
  const shouldSkip = shouldSkipRef.current;

  const skip = useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}

export default function TeachersTable({
  tableData,
}: {
  tableData: TeacherTableRow[];
}) {
  //  const rerender = useReducer(() => ({}), {})[1];

  const columns = useMemo<ColumnDef<TeacherTableRow>[]>(
    () => [
      {
        header: 'Email',
        accessor: 'email',
      }
    ],
    []
  );

  const [data, setData] = useState<TeacherTableRow[]>([]);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [updatedRows, setUpdatedRows] = useState<{ row: number, updating: boolean }>({ row: 0, updating: false });
  const [newEmail, setNewEmail] = useState("");
  const [addTeacherEmail, setAddTeacherEmail] = useState("");

  useEffect(() => {
    setData(tableData);
  }, [tableData])

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setData(old =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
    },
    debugTable: false,
  });

  return (
    <div className='grid grid-cols-3'>
      <div className="p-2 col-span-2">
        <div className="h-2" />
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <th key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <div>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanFilter() ? (
                            <div>
                              <Filter column={header.column} table={table} />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => {
                    switch (cell.column.columnDef.header) {
                      case 'Email':
                        return (
                          <td key={cell.id} className='text-black px-2 py-1 whitespace-nowrap border truncate max-w-[18rem] w-72'>
                            {
                              updatedRows.row === Number(row.id) && updatedRows.updating ?
                                (<>
                                  <input
                                    type='text'
                                    value={newEmail}
                                    placeholder={row.original.email}
                                    className='w-64 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple focus:outline-none rounded-md p-0.5'
                                    onChange={e => setNewEmail(e.target.value)}
                                  >
                                  </input>
                                </>) : (<>{row.original.email}</>)
                            }
                          </td>
                        );
                    }
                  })}
                  <td>
                    <button
                      className='bg-primary-purple text-white rounded-md px-4 py-2 ml-1'
                      onClick={async () => {
                        if (updatedRows.row === Number(row.id) && updatedRows.updating === true) {
                          var response;
                          if (newEmail.length > 0) {
                            response = await updateTeacher(newEmail, row.original.email)
                          }
                          else if (newEmail.length === 0) {
                            response = await updateTeacher(row.original.email, row.original.email)
                          }
                          else {
                            response = await updateTeacher(newEmail, row.original.email)
                          }
                          if (response.status === 200) {
                            const res = await getAllTeachers();
                            setData(res);
                            alert("Success updating teacher!");
                          }
                          setUpdatedRows({ row: Number(row.id), updating: false })
                          setNewEmail("");
                        }
                        else {
                          setUpdatedRows({ row: Number(row.id), updating: true })
                          setNewEmail("");
                        }
                      }}
                    >{updatedRows.row === Number(row.id) && updatedRows.updating ? "Save" : "Edit"}</button>
                    {!(updatedRows.row === Number(row.id) && updatedRows.updating) ? (<button
                      className='bg-red-900 text-white rounded-md px-4 py-2 ml-1'
                      onClick={async () => {
                        const response = await deleteTeacher(row.original.email);
                        if (response.status === 200) {
                          const res = await getAllTeachers();
                          setData(res);
                          alert("Success deleting teacher!");
                        }
                      }}>
                      Delete
                    </button>) : (<></>)}
                    {updatedRows.row === Number(row.id) && updatedRows.updating ? (<>
                      <button
                        className=' bg-red-900 text-white rounded-md px-4 py-2 ml-1'
                        onClick={() => {
                          setUpdatedRows({ row: 0, updating: false })
                          setNewEmail("");
                        }}
                      >Cancel</button>
                    </>) : (<></>)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              min={1}
              max={table.getPageCount()}
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-2">
        <div className="h-2" />
        <label htmlFor='addTeacher' className='mr-4'>Add a teacher's email address:</label>
        <input 
        id='addTeacher' 
        type='email' 
        placeholder='e.g.: j.doe@fontys.nl' 
        value={(addTeacherEmail)}
        className='border-primary-purple border-2 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple focus:outline-none rounded-md p-1 overflow-auto w-72 max-w-[18rem]'
        onChange={e => setAddTeacherEmail(e.target.value)}></input>
        <button type='button' className='bg-primary-purple text-white rounded-md px-4 py-2 ml-4' onClick={async () => {
          if (addTeacherEmail.length > 0) {
            const response = await addTeacher(addTeacherEmail);
            if (response.status === 201) {
              const res = await getAllTeachers();
              setData(res);
              setAddTeacherEmail("")
              alert("Added teacher successfully!");
            }
          }
          else {
            alert("Teacher email cannot be empty!")
          }
        }}>Add</button>
      </div>
    </div>
  )
}

function Filter({
  column,
  table,
}: {
  column: Column<any, any>
  table: Table<any>
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id)

  const columnFilterValue = column.getFilterValue()

  return typeof firstValue === 'number' ? (
    <div className="flex space-x-2">
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[0] ?? ''}
        onChange={e =>
          column.setFilterValue((old: [number, number]) => [
            e.target.value,
            old?.[1],
          ])
        }
        placeholder={`Min`}
        className="w-24 border shadow rounded"
      />
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[1] ?? ''}
        onChange={e =>
          column.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value,
          ])
        }
        placeholder={`Max`}
        className="w-24 border shadow rounded"
      />
    </div>
  ) : (
    <input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="w-36 border shadow rounded"
    />
  )
}
