import React, { useState } from "react";
import axios from "axios";

function TextToSQL() {
    const [query, setQuery] = useState("");
    const [sql, setSQL] = useState("");
    const [results, setResults] = useState([]);

    const handleSubmit = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/tosql", {
                "query": query
            });
            setSQL(response.data.sql_query);
            setResults(response.data.results);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Text-to-SQL Demo</h2>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query..."
            />
            <button onClick={handleSubmit}>Submit</button>

            {sql && (
                <div>
                    <h3>Generated SQL:</h3>
                    <pre>{sql}</pre>
                </div>
            )}

            {results.length > 0 && (
                <div>
                    <h3>Query Results:</h3>
                    <table border="1">
                        <thead>
                            <tr>
                                {Object.keys(results[0]).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
                                        <td key={i}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default TextToSQL;
