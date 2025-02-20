import React, { useState } from "react";
import axios from "axios";

function TextToSQL() {
    const [query, setQuery] = useState("");
    const [schemaDetails, setSchemaDetails] = useState("");
    const [sql, setSQL] = useState("");
    const [editedSQL, setEditedSQL] = useState("");
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [showSchema, setShowSchema] = useState(false);

    // Generate SQL & Execute it
    const handleGenerateSQL = async () => {
        setError("");
        setResults([]);
        try {
            const response = await axios.post("http://127.0.0.1:8000/generate_sql", {
                query,
                schema_details: schemaDetails,
            });
            setSQL(response.data.sql_query);
            setEditedSQL(response.data.sql_query);
            if (response.data.error) {
                setError(response.data.error);
            } else {
                setResults(response.data.results);
            }
        } catch (err) {
            setError("Error generating SQL.");
            console.error("Error:", err);
        }
    };

    // Execute manually edited SQL
    const handleExecuteSQL = async () => {
        setError("");
        setResults([]);
        try {
            const response = await axios.post("http://127.0.0.1:8000/execute_sql", { sql_query: editedSQL });
            setResults(response.data.results);
        } catch (err) {
            setError(err.response?.data?.detail || "SQL Execution Error.");
            console.error("Error:", err);
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
                style={{ width: "100%", marginBottom: "10px" }}
            />
            <button onClick={handleGenerateSQL}>Generate SQL</button>

            {/* Toggle Schema Input */}
            <button onClick={() => setShowSchema(!showSchema)} style={{ marginLeft: "10px" }}>
                {showSchema ? "Hide Schema Input" : "Show Schema Input"}
            </button>

            {showSchema && (
                <div style={{ marginTop: "10px" }}>
                    <h3>Schema Details:</h3>
                    <textarea
                        value={schemaDetails}
                        onChange={(e) => setSchemaDetails(e.target.value)}
                        rows={4}
                        placeholder="Enter schema details..."
                        style={{ width: "100%", marginBottom: "10px" }}
                    />
                </div>
            )}

            {sql && (
                <div>
                    <h3>Generated SQL:</h3>
                    <textarea
                        value={editedSQL}
                        onChange={(e) => setEditedSQL(e.target.value)}
                        rows={4}
                        style={{ width: "100%", marginBottom: "10px" }}
                    />
                    <button onClick={handleExecuteSQL}>Execute SQL</button>
                </div>
            )}

            {error && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    <h3>Error:</h3>
                    <pre>{error}</pre>
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
