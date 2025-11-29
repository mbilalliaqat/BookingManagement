// FILEPATH: d:/Projects/booking-management/src/components/ui/Table.jsx

function Table({ data, columns, maxHeight = '430px' }) {
  return (
    <div className="h-full flex flex-col" style={{ maxHeight: maxHeight }}>
      <div className="overflow-x-auto h-full rounded-2xl shadow-md">
        <div className="inline-block min-w-full">
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-[9px] md:text-[10px] text-black shadow-lg">
                <tr>
                  {columns?.map((col, index) => (
                    <th
                      key={index}
                      className="sticky top-0 px-2 py-2 text-left capitalize cursor-pointer z-10 font-bold tracking-wide uppercase"
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
                      className="text-center text-slate-500 py-8"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  data?.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`transition-all duration-200 ease-in-out ${
                        rowIndex % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-cyan-50/40 via-blue-50/30 to-teal-50/40'
                      } hover:bg-gradient-to-r hover:from-cyan-100/50 hover:via-blue-100/40 hover:to-teal-100/50 hover:shadow-sm`}
                    >
                      {columns?.map((col, colIndex) => {
                        const value = row[col.accessor];
                        const rendered = col.render ? col.render(value, row) : value || '-';
                        
                        // Determine text color based on column type or value
                        let textColorClass = 'text-slate-700';
                        
                        // Check if it's a monetary/numeric column (containing keywords)
                        const header = col.header?.toLowerCase() || '';
                        if (header.includes('receivable') || header.includes('amount') || header.includes('total')) {
                          textColorClass = 'text-emerald-600 font-semibold';
                        } else if (header.includes('remaining') || header.includes('due') || header.includes('pending')) {
                          textColorClass = 'text-amber-600 font-semibold';
                        } else if (header.includes('cash') || header.includes('office') || header.includes('balance')) {
                          textColorClass = 'text-cyan-600 font-semibold';
                        } else if (header.includes('paid') || header.includes('bank')) {
                          textColorClass = 'text-slate-700';
                        }
                        
                        return (
                          <td
                            key={colIndex}
                            className={`p-1 font-medium text-[6px] md:text-[12px] ${textColorClass} border border-cyan-100`}
                          >
                            {rendered}
                          </td>
                        );
                      })}
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