// FILEPATH: d:/Projects/booking-management/src/components/ui/Table.jsx

function Table({ data, columns, maxHeight = '400px' }) {
  return (
    <div className="h-full flex flex-col" style={{ maxHeight: maxHeight }}>
      <div className="overflow-x-auto h-full   rounded-2xl">
        <div className="inline-block min-w-full">
          <div className="overflow-hidden">
            <table className="min-w-full ">
              <thead className="bg-[#111827] text-[9px] md:text-[10px] text-gray-400">
                <tr>
                  {columns?.map((col, index) => (
                    <th
                      key={index}
                      className="sticky top-0 px-1 py-1 text-left  capitalize cursor-pointer  z-10"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {data?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className=" text-center text-gray-800"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  data?.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`transition-all duration-200 ease-in-out ${
                        rowIndex % 2 === 0 ? 'bg-black/5' : 'bg-transparent'
                      } hover:bg-white/95`}
                    >
                      {columns?.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className="p-1 font-medium text-[6px] md:text-[12px] text-black border border-black/40"
                        >
                          {col.render ? col.render(row[col.accessor], row) : row[col.accessor] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Table;