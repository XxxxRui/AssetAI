function DataTable({ columns, rows, resultColumnIndex }) {
    const colCount = columns.length;
    
    return (
      <div className="table-card">
        <table className="data-table" data-columns={colCount}>
          <thead>
            <tr>
              {columns.map((column, colIndex) => (
                <th key={column} className={`col-${colIndex}`}>{column}</th>
              ))}
            </tr>
          </thead>
  
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  const isResult = cellIndex === resultColumnIndex;
  
                  return (
                    <td key={cellIndex} className={`col-${cellIndex}`}>
                      {isResult ? (
                        <span
                          className={`result-badge ${
                            cell === "Non-Compliant" ? "danger" : "ok"
                          }`}
                        >
                          <span className="result-dot"></span>
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  export default DataTable;