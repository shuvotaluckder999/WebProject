{/*import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useParams } from "react-router-dom"

function Classroom() {
  const { id } = useParams()
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")
  const token = localStorage.getItem("token")

  // ✅ useCallback pour éviter le warning de dépendances
  const loadTasks = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/task/${id}`, {
        headers: { authorization: token }
      })
      setTasks(res.data)
    } catch (err) {
      console.error("Error loading tasks:", err)
    }
  }, [id, token]) // Dépendances correctes

  const addTask = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/task/add",
        { title, emoji: "😎", difficulty: "easy", classId: id },
        { headers: { authorization: token } }
      )
      loadTasks()
    } catch (err) {
      console.error("Error adding task:", err)
    }
  }

  const spin = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/assign/spin/${id}`,
        {},
        { headers: { authorization: token } }
      )
      alert("Tasks assigned!")
    } catch (err) {
      console.error("Error spinning tasks:", err)
    }
  }

  // ✅ useEffect avec loadTasks en dépendance
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return (
    <div>
      <h2>Classroom</h2>

      <input
        placeholder="Task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={addTask}>Add Task</button>

      <button onClick={spin}>Spin Tasks</button>

      {tasks.map((t) => (
        <div key={t._id}>
          {t.title} {t.emoji}
        </div>
      ))}
    </div>
  )
}

export default Classroom*/}