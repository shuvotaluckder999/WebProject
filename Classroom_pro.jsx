import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore, useClassStore, useTaskStore, useAssignmentStore } from "../store";
import { Button, Card, Loading, Alert, Modal, Badge } from "../components/Common";
import { FiArrowLeft, FiPlus, FiRefreshCcw } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

export default function Classroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getClass, currentClass, loading: classLoading, error: classError } = useClassStore();
  const { fetchTasks, tasks, loading: tasksLoading, error: tasksError } = useTaskStore();
  const { fetchMyAssignments, assignments, loading: assignLoading, spinAssignments } =
    useAssignmentStore();

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium",
    dueDate: "",
    type: "assignment",
  });

  useEffect(() => {
    if (!id) return;
    getClass(id);
    fetchTasks(id);
    if (user?.role === "student") {
      fetchMyAssignments(id);
    }
  }, [id, user, getClass, fetchTasks, fetchMyAssignments]);

  const isTeacher = user?.role === "teacher" && currentClass?.teacher._id === user._id;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.dueDate) {
      alert("Please fill all required fields");
      return;
    }
    // API call to create task here
    setShowCreateTask(false);
    setFormData({ title: "", description: "", difficulty: "medium", dueDate: "", type: "assignment" });
  };

  const handleSpin = async () => {
    if (window.confirm("Assign random tasks to yourself?")) {
      const result = await spinAssignments(id);
      if (result.success) {
        alert("Task assigned successfully!");
        fetchMyAssignments(id); // refresh assignments
      }
    }
  };

  const loading = classLoading || tasksLoading || assignLoading;

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>

          {currentClass && (
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-800">{currentClass.name}</h1>
                <p className="text-gray-600 mt-2">{currentClass.description}</p>
                <div className="flex gap-4 mt-3">
                  <Badge variant="primary">{currentClass.subject}</Badge>
                  <Badge variant="gray">Code: {currentClass.code}</Badge>
                  <Badge variant="success">
                    {currentClass.students?.length || 0}/{currentClass.capacity} students
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {/* Teacher: Only Create Task */}
                {isTeacher && (
                  <Button variant="primary" onClick={() => setShowCreateTask(true)}>
                    <FiPlus /> Create Task
                  </Button>
                )}

                {/* Student: Only Spin */}
                {user?.role === "student" && (
                  <Button variant="secondary" onClick={handleSpin} title="Spin Task">
                    <FiRefreshCcw /> Spin Task
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {classError && <Alert message={classError} type="error" />}
        {tasksError && <Alert message={tasksError} type="error" />}

        {/* Tasks Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Tasks & Assignments</h2>

          {tasks.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-500">No tasks yet</p>
              {isTeacher && (
                <Button variant="primary" size="sm" onClick={() => setShowCreateTask(true)} className="mt-4">
                  Create First Task
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card
                  key={task._id}
                  className="cursor-pointer hover:scale-100 transform transition"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant={task.difficulty === "hard" ? "danger" : task.difficulty === "medium" ? "warning" : "success"}>
                          {task.difficulty}
                        </Badge>
                        <Badge variant="primary">{task.type}</Badge>
                        <Badge variant="gray">{task.points} pts</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Due in</p>
                      <p className="font-semibold text-gray-800">
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Student Assignments */}
        {user?.role === "student" && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Assignments</h2>
            {assignments.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500">No assignments yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment._id} className="hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{assignment.task?.title}</h3>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={
                            assignment.status === "graded" ? "success" :
                            assignment.status === "submitted" ? "warning" :
                            assignment.status === "in_progress" ? "primary" :
                            "gray"
                          }>
                            {assignment.status.replace("_", " ")}
                          </Badge>
                          {assignment.isLate && <Badge variant="danger">Late</Badge>}
                        </div>
                      </div>

                      {assignment.status !== "graded" && (
                        <Button variant="primary" size="sm" onClick={() => navigate(`/assignment/${assignment._id}`)}>
                          Work on Assignment
                        </Button>
                      )}
                      {assignment.status === "graded" && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Grade</p>
                          <p className="text-2xl font-bold text-green-600">
                            {assignment.grade?.percentage.toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <Modal isOpen={true} title="Task Details" onClose={() => setSelectedTask(null)}>
            <h3 className="text-lg font-bold">{selectedTask.title}</h3>
            <p className="mt-2">{selectedTask.description}</p>
            <div className="flex gap-2 mt-3">
              <Badge variant={selectedTask.difficulty === "hard" ? "danger" : selectedTask.difficulty === "medium" ? "warning" : "success"}>
                {selectedTask.difficulty}
              </Badge>
              <Badge variant="primary">{selectedTask.type}</Badge>
              <Badge variant="gray">{selectedTask.points} pts</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Due {formatDistanceToNow(new Date(selectedTask.dueDate), { addSuffix: true })}
            </p>
          </Modal>
        )}

        {/* Create Task Modal */}
        <Modal
          isOpen={showCreateTask}
          title="Create New Task"
          onClose={() => setShowCreateTask(false)}
          onConfirm={handleCreateTask}
        >
          <form className="space-y-4">
            <div>
              <label className="label">Task Title *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                rows="4"
                className="input"
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Project</option>
                  <option value="homework">Homework</option>
                </select>
              </div>

              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Due Date *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}