import { useState, useEffect, useRef, useCallback, useMemo, ChangeEvent } from 'react';
import RunScriptsButton from "./run-scripts-button";
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
import { TableRow } from '../types/table-row';
import { updateUser, getAll, exportCSV, importCSV } from '../services/user-service';
import { LoaderCircle } from "lucide-react";

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

const defaultColumn: Partial<ColumnDef<TableRow>> = {
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

function timeout(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export default function TeacherTable({
  tableData,
}: {
  tableData: TableRow[];
}) {
  //  const rerender = useReducer(() => ({}), {})[1];

  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        header: 'Email',
        accessor: 'email',
      },
      {
        header: 'VPN ID',
        accessor: 'vpnid',
      },
      {
        header: 'Certificate Authority',
        accessor: 'certificateAuthority',
      },
      {
        header: 'Certificate',
        accessor: 'certificate',
      },
      {
        header: 'Description',
        accessor: 'description',
      },
      {
        header: 'Data Ciphers',
        accessor: 'dataCiphers',
      },
      {
        header: 'TLS',
        accessor: 'tlsStaticKey',
      },
      {
        header: 'Data Ciphers Fallback',
        accessor: 'dataCiphersFallback',
      },
      {
        header: 'Digest',
        accessor: 'digest',
      },
      {
        header: 'Dev Mode',
        accessor: 'devMode',
      },
      {
        header: 'Protocol',
        accessor: 'protocol',
      },
      {
        header: 'Local Port',
        accessor: 'localPort',
      },
      {
        header: 'Type',
        accessor: 'type',
      },
      {
        header: 'Private Key',
        accessor: 'privateKey',
      },
    ],
    []
  );

  const [data, setData] = useState<TableRow[]>([]);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [updatedRows, setUpdatedRows] = useState<{ row: number, updating: boolean }>({ row: 0, updating: false });
  const [newEmail, setNewEmail] = useState("");
  const [newVpnId, setNewVpnId] = useState("");
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [showButtons, setShowButtons] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFileClick = (update: boolean) => {
    setUpdateExisting(update);
    if (fileRef.current) {
      fileRef.current.click();
    }
  }
  const fileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      setIsLoading(true);
      const response = await importCSV(event.target.files[0], updateExisting);
      if (response.status === 200) {
        await timeout(2000)
        const res = await getAll();
        setData(res);
        getCsv();
        setUpdateExisting(true);
        //alert("Success updating table!");
      }
      setIsLoading(false);
      setShowButtons(false);
    }
  }

  function getCsv() {
    const getCSV = async () => {
      try {
        const fileUrl = await exportCSV();
        if (fileUrl) setFileUrl(fileUrl);
      } catch (error) {
        console.error(error);
      }
    };
  
    getCSV();
  }

  useEffect(() => {
    setData(tableData);
    getCsv()
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
          <LoaderCircle className="animate-spin rounded-full h-32 w-32 text-primary-purple" />
          {/* <h1 className='text-primary-purple'>Importing users, please wait...</h1> */}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-12 justify-between'>
      <div className="p-2 col-span-11">
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
                          <td key={cell.id} className='text-black px-2 py-1 whitespace-nowrap border truncate max-w-[18rem] '>
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
                      case 'VPN ID':
                        return (
                          <td key={cell.id} className='text-black px-2 py-1 whitespace-nowrap border truncate max-w-[6rem] '>
                            {
                              updatedRows.row === Number(row.id) && updatedRows.updating ?
                                (<>
                                  <input
                                    type='text'
                                    value={newVpnId}
                                    placeholder={row.original.vpnid}
                                    className='w-9 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple focus:outline-none rounded-md p-0.5'
                                    onChange={e => setNewVpnId(e.target.value)}
                                  >
                                  </input>
                                </>) : (<>{row.original.vpnid}</>)
                            }
                          </td>
                        );
                      case 'Certificate Authority':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.certificateAuthority}
                          </td>
                        );
                      case 'Certificate':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.certificate}
                          </td>
                        );
                      case 'Description':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[9rem] '>
                            {row.original.description}
                          </td>
                        );
                      case 'Data Ciphers':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.dataCiphers}
                          </td>
                        );
                      case 'TLS':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.tlsStaticKey}
                          </td>
                        );
                      case 'Data Ciphers Fallback':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.dataCiphersFallback}
                          </td>
                        );
                      case 'Digest':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.digest}
                          </td>
                        );
                      case 'Dev Mode':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.devMode}
                          </td>
                        );
                      case 'Protocol':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.protocol}
                          </td>
                        );
                      case 'Local Port':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.localPort}
                          </td>
                        );
                      case 'Type':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.type}
                          </td>
                        );
                      case 'Private Key':
                        return (
                          <td key={cell.id} className='text-black px-4 py-2 whitespace-nowrap border truncate max-w-[6rem] '>
                            {row.original.privateKey}
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
                          if (newEmail.length > 0 && newVpnId.length > 0) {
                            response = await updateUser(newEmail, newVpnId, row.original.email, row.original.vpnid)
                          }
                          else if (newEmail.length === 0 && newVpnId.length > 0) {
                            response = await updateUser(row.original.email, newVpnId, row.original.email, row.original.vpnid)
                          }
                          else if (newVpnId.length === 0 && newEmail.length > 0) {
                            response = await updateUser(newEmail, row.original.vpnid, row.original.email, row.original.vpnid)
                          }
                          else {
                            response = await updateUser(row.original.email, row.original.vpnid, row.original.email, row.original.vpnid)
                          }
                          if (response.status === 200) {
                            const res = await getAll();
                            setData(res);
                            getCsv()
                            alert("User updated successfully!");
                          }
                          setUpdatedRows({ row: Number(row.id), updating: false })
                          setNewEmail("");
                          setNewVpnId("");
                        }
                        else {
                          setUpdatedRows({ row: Number(row.id), updating: true })
                          setNewEmail("");
                          setNewVpnId("");
                        }
                      }}
                    >{updatedRows.row === Number(row.id) && updatedRows.updating ? "Save" : "Edit"}</button>
                    {updatedRows.row === Number(row.id) && updatedRows.updating ? (<>
                      <button
                        className=' bg-red-900 text-white rounded-md px-4 py-2 ml-1'
                        onClick={() => {
                          setUpdatedRows({ row: 0, updating: false })
                          setNewEmail("");
                          setNewVpnId("");
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
                {pageSize} per page
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-2">
        <div className="h-2" />
        <input
          type='file'
          accept='.csv'
          ref={fileRef}
          className='hidden'
          onChange={(event) => {
            fileInput(event);
            event.target.value = "";
          }}
        >
        </input>
        <button
          type='button'
          onClick={() => setShowButtons(!showButtons)}
          className="text-white bg-primary-purple hover:bg-primary-purple-dark px-3 py-2 rounded-md hover:cursor-pointer text-nowrap">
          Import CSV file
        </button>
        <br></br>
        <div
          hidden={!showButtons}>
          <div className='inline-grid -mb-2'>
            <button
              type='button'
              onClick={() => handleFileClick(true)}
              className='text-white bg-slate-700 hover:bg-slate-800 px-3 py-2 rounded-md mb-2 mt-2 hover:cursor-pointer'>
              Update rows
            </button>
            <button
              type='button'
              onClick={() => handleFileClick(false)}
              className='text-white bg-slate-700 hover:bg-slate-800 px-3 py-2 rounded-md hover:cursor-pointer'>
              Overwrite rows
            </button>
          </div>
        </div>
        <br></br>
        {fileUrl && (
          <a
            href={fileUrl}
            download="users_export.csv"
            className="text-white bg-primary-purple hover:bg-primary-purple-dark px-3 py-2 rounded-md hover:cursor-pointer text-nowrap"
          >
            Export CSV file
          </a>
        )}
        <br></br>
        <RunScriptsButton/>
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
