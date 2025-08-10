import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

export default function History({ history, setHistory }) {
    function deleteMonth(index) {
        if (!window.confirm("Delete this month from history?")) return;
        setHistory(history.filter((_, i) => i !== index));
    }

    return (
        <div className="history-container">
            <header className="topbar">
                <h1>Monthly History</h1>
                <Link to="/">
                    <button>Back to Dashboard</button>
                </Link>
            </header>

            {history.length === 0 ? (
                <p>No history available</p>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Budget</th>
                            <th>Spent</th>
                            <th className="actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((h, i) => (
                            <tr key={i}>
                                <td>{h.month}</td>
                                <td>₹{h.budget.toLocaleString("en-IN")}</td>
                                <td>₹{h.spent.toLocaleString("en-IN")}</td>
                                <td className="actions">
                                    <button className="danger small" onClick={() => deleteMonth(i)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
