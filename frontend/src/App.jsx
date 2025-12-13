import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { BASE_URL } from './config'

const emptyForm = {
  title: '',
  amount: '',
  category: '',
  date: '',
}

function App() {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`${BASE_URL}/expenses`)
        if (!response.ok) {
          throw new Error('Failed to fetch expenses')
        }
        const data = await response.json()
        setExpenses(data || [])
      } catch (err) {
        setError(err?.message || 'Something went wrong while loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const total = useMemo(
    () =>
      expenses.reduce(
        (acc, item) => acc + (Number(item.amount) || 0),
        0,
      ),
    [expenses],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title || !form.amount || !form.category || !form.date) {
      setError('Please fill out all fields before submitting.')
      return
    }

    const payload = {
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    }

    try {
      setSubmitting(true)
      const response = await fetch(`${BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to add expense')
      }

      const created = await response.json()
      const expenseWithId = {
        ...payload,
        // Contract returns `{ message, id }`, so merge the id onto the payload we just sent
        id: created?.id,
      }
      setExpenses((prev) => [...prev, expenseWithId])
      setForm(emptyForm)
    } catch (err) {
      setError(err?.message || 'Unable to add expense right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Expense Tracker</p>
          <h1>Dashboard</h1>
          <p className="subtitle">
            Data served from <code>{BASE_URL}</code>
          </p>
        </div>
        <div className="total-chip">
          <span>Total</span>
          <strong>${total.toLocaleString()}</strong>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <div className="card-header">
            <h2>Add Expense</h2>
            <p className="helper">
              Sends a POST request to <code>/expenses</code> with JSON body.
            </p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Title</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Coffee"
              />
            </label>

            <label className="form-field">
              <span>Amount</span>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="e.g., 12.50"
              />
            </label>

            <label className="form-field">
              <span>Category</span>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g., Food"
              />
            </label>

            <label className="form-field">
              <span>Date</span>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Add Expense'}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Expenses</h2>
            <p className="helper">Fetched from <code>/expenses</code>.</p>
          </div>

          {loading ? (
            <p className="muted">Loading expenses…</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th className="numeric">Amount</th>
                    <th>Category</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="muted">
                        No expenses found.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item.id || `${item.title}-${item.date}`}>
                        <td>{item.title}</td>
                        <td className="numeric">
                          ${Number(item.amount ?? 0).toLocaleString()}
                        </td>
                        <td>{item.category}</td>
                        <td>
                          {item.date
                            ? new Date(item.date).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
