import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import Chart from "chart.js/auto";
import History from "./History";
import "./App.css";

const LOCAL_BUDGET_KEY = "budgetData";
const LOCAL_HISTORY_KEY = "history";
const LOCAL_THEME_KEY = "theme";

function getMonthKey(date = new Date()) {
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function formatINR(num) {
  if (num == null) return "₹0";
  return "₹" + Number(num).toLocaleString("en-IN");
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [budgetData, setBudgetData] = useState(null);
  const [history, setHistory] = useState([]);
  const [themeDark, setThemeDark] = useState(() => localStorage.getItem(LOCAL_THEME_KEY) === "dark");

  const [budgetInput, setBudgetInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");

  useEffect(() => {
    const storedBudget = JSON.parse(localStorage.getItem(LOCAL_BUDGET_KEY));
    const storedHistory = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY)) || [];
    const currentMonth = getMonthKey();

    if (storedBudget && storedBudget.month !== currentMonth) {
      const spent = (storedBudget.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      const newHist = [...storedHistory, { month: storedBudget.month, budget: storedBudget.amount || 0, spent }];
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(newHist));
      localStorage.removeItem(LOCAL_BUDGET_KEY);
      setHistory(newHist);
      setBudgetData(null);
    } else {
      setHistory(storedHistory);
      setBudgetData(storedBudget);
    }

    setThemeDark(localStorage.getItem(LOCAL_THEME_KEY) === "dark");
  }, [location.key]);

  useEffect(() => {
    if (budgetData) {
      localStorage.setItem(LOCAL_BUDGET_KEY, JSON.stringify(budgetData));
    } else {
      localStorage.removeItem(LOCAL_BUDGET_KEY);
    }
  }, [budgetData]);

  useEffect(() => {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (themeDark) {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem(LOCAL_THEME_KEY, "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem(LOCAL_THEME_KEY, "light");
    }
  }, [themeDark]);

  const totalExpenses = (budgetData?.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = (budgetData?.amount || 0) - totalExpenses;

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const expenses = budgetData?.expenses || [];
    const totals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
      return acc;
    }, {});
    const labels = Object.keys(totals);
    const data = Object.values(totals);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (labels.length === 0) return;

    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
    });
  }, [budgetData]);

  function handleSetBudget(e) {
    e.preventDefault();
    const amt = parseFloat(budgetInput);
    if (isNaN(amt) || amt <= 0) return alert("Enter a valid positive budget amount");

    const currentMonth = getMonthKey();
    if (!budgetData || budgetData.month !== currentMonth) {
      setBudgetData({ month: currentMonth, amount: amt, expenses: [] });
    } else {
      setBudgetData({ ...budgetData, amount: (budgetData.amount || 0) + amt });
    }
    setBudgetInput("");
  }

  function handleAddExpense(e) {
    e.preventDefault();
    if (!budgetData) return alert("Please set the budget first.");
    const amt = parseFloat(amountInput);
    if (!titleInput || isNaN(amt) || !categoryInput) return alert("Fill all fields correctly.");
    const newExpense = { title: titleInput, amount: amt, category: categoryInput, date: new Date().toLocaleDateString() };
    setBudgetData({ ...budgetData, expenses: [...budgetData.expenses, newExpense] });
    setTitleInput(""); setAmountInput(""); setCategoryInput("");
  }

  function deleteExpense(index) {
    setBudgetData({ ...budgetData, expenses: budgetData.expenses.filter((_, i) => i !== index) });
  }

  function saveCurrentMonthToHistory() {
    if (!budgetData) return alert("No budget to save.");
    const spent = (budgetData.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const newHist = [...history, { month: budgetData.month, budget: budgetData.amount || 0, spent }];
    setHistory(newHist);
    setBudgetData(null);
    navigate("/history");
  }

  function deleteAllData() {
    if (!window.confirm("Clear ALL data?")) return;
    localStorage.removeItem(LOCAL_BUDGET_KEY);
    localStorage.removeItem(LOCAL_HISTORY_KEY);
    setBudgetData(null);
    setHistory([]);
  }

  function exportHistoryCSV() {
    const rows = [["Month", "Budget", "Spent"], ...history.map(h => [h.month, h.budget, h.spent])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "monthly_history.csv";
    a.click();
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="app-root">
          <header className="topbar">
            <div>
              <h1>Personal Finance Dashboard</h1>
              <div className="meta">Month: {getMonthKey()}</div>
            </div>
            <div className="controls">
              <button onClick={() => setThemeDark(d => !d)}>{themeDark ? "Light" : "Dark"}</button>
              <button onClick={() => navigate("/history")}>History</button>
              <button onClick={exportHistoryCSV}>Export CSV</button>
              <button className="danger" onClick={deleteAllData}>Clear All</button>
            </div>
          </header>

          <main className="content-grid">
            <div className="left-col">
              <section className="card">
                <h2>Monthly Budget</h2>
                <form onSubmit={handleSetBudget} className="inline-form">
                  <input value={budgetInput} onChange={e => setBudgetInput(e.target.value)} placeholder="Add to budget (₹)" />
                  <button type="submit">Add</button>
                </form>
                <div className="budget-stats">
                  <div>Budget: <strong>{formatINR(budgetData?.amount || 0)}</strong></div>
                  <div>Expenses: <strong>{formatINR(totalExpenses)}</strong></div>
                  <div>Remaining: <strong className={remaining < 0 ? "overspend" : ""}>{formatINR(remaining)}</strong></div>
                </div>
              </section>

              <section className="card">
                <h2>Add Expense</h2>
                <form onSubmit={handleAddExpense} className="expense-form">
                  <input placeholder="Description" value={titleInput} onChange={e => setTitleInput(e.target.value)} />
                  <input placeholder="Amount (₹)" type="number" value={amountInput} onChange={e => setAmountInput(e.target.value)} />
                  <select value={categoryInput} onChange={e => setCategoryInput(e.target.value)}>
                    <option value="">Category</option>
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Bills</option>
                    <option>Entertainment</option>
                    <option>Other</option>
                  </select>
                  <button type="submit">Add Expense</button>
                </form>
              </section>

              <section className="card">
                <h2>Expense List</h2>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Description</th><th>Amount</th><th>Category</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {(budgetData?.expenses || []).length === 0
                        ? <tr><td colSpan={5}>No expenses yet</td></tr>
                        : budgetData.expenses.map((exp, i) => (
                          <tr key={i}>
                            <td>{exp.title}</td>
                            <td>{formatINR(exp.amount)}</td>
                            <td>{exp.category}</td>
                            <td>{exp.date}</td>
                            <td><button className="small danger" onClick={() => deleteExpense(i)}>X</button></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="right-col">
              <section className="card chart-card">
                <h2>Spending Breakdown</h2>
                <div className="chart-area">
                  <canvas ref={chartRef}></canvas>
                </div>
              </section>

              <section className="card">
                <h2>Monthly Summary</h2>
                {history.length === 0 ? <div>No archive yet</div> :
                  <table>
                    <thead><tr><th>Month</th><th>Budget</th><th>Spent</th></tr></thead>
                    <tbody>
                      {history.slice(-6).reverse().map((h, idx) => (
                        <tr key={idx}><td>{h.month}</td><td>{formatINR(h.budget)}</td><td>{formatINR(h.spent)}</td></tr>
                      ))}
                    </tbody>
                  </table>}
                <div style={{ marginTop: 8 }}>
                  <button onClick={saveCurrentMonthToHistory}>Save & Go to History</button>
                </div>
              </section>
            </aside>
          </main>
        </div>
      } />
      <Route path="/history" element={<History history={history} setHistory={setHistory} />} />
    </Routes>
  );
}
