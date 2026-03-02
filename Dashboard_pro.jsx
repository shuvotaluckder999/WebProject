import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useClassStore } from "../store";
import { Button, Card, Loading, Alert, Modal } from "../components/Common";
import { FiLogOut, FiPlus, FiLogIn } from "react-icons/fi";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    joinClass,
    clearError,
  } = useClassStore();

  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "Mathematics",
    code: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchClasses();
    }
  }, [user, navigate, fetchClasses]);

  const handleCreateClass = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setValidationErrors({ name: "Class name is required" });
      return;
    }

    const result = await createClass({
      name: formData.name,
      description: formData.description,
      subject: formData.subject,
    });

    if (result.success) {
      resetForm();
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      setValidationErrors({ code: "Class code is required" });
      return;
    }

    const result = await joinClass(formData.code);

    if (result.success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      subject: "Mathematics",
      code: "",
    });
    setValidationErrors({});
    setShowModal(false);
    setIsCreating(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">📚 Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {user.name}! ({user.role})
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {error && (
          <div className="mb-6">
            <Alert message={error} type="error" onClose={clearError} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4 flex-wrap">
          {/* Only Teacher can create */}
          {user.role === "teacher" && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setIsCreating(true);
                setShowModal(true);
              }}
            >
              <FiPlus /> Create Class
            </Button>
          )}

          {/* Everyone can join */}
          <Button
            variant={user.role === "teacher" ? "outline" : "primary"}
            size="lg"
            onClick={() => {
              setIsCreating(false);
              setShowModal(true);
            }}
          >
            <FiLogIn /> Join Class
          </Button>
        </div>

        {/* Class List */}
        {loading ? (
          <Loading />
        ) : classes.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No classes yet</p>
            <p className="text-gray-400">
              {user.role === "teacher"
                ? "Create your first class to get started!"
                : "Join a class using the code provided by your teacher"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Card
                key={classItem._id}
                className="cursor-pointer hover:scale-105 transform transition"
                onClick={() => navigate(`/class/${classItem._id}`)}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {classItem.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {classItem.subject}
                  </p>
                </div>

                {classItem.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {classItem.description}
                  </p>
                )}

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-gray-600">
                    {classItem.students?.length || 0}/
                    {classItem.capacity} students
                  </span>
                  <span className="badge-primary">
                    {classItem.code}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Teacher: {classItem.teacher?.name || "Unknown"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title={
          user.role === "teacher"
            ? isCreating
              ? "Create New Class"
              : "Join a Class"
            : "Join a Class"
        }
        onClose={resetForm}
      >
        <form
          onSubmit={
            user.role === "teacher" && isCreating
              ? handleCreateClass
              : handleJoinClass
          }
          className="space-y-4"
        >
          {user.role === "teacher" && isCreating ? (
            <>
              <div>
                <label className="label">Class Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                />
                {validationErrors.name && (
                  <span className="error-text">
                    {validationErrors.name}
                  </span>
                )}
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="label">Class Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="input uppercase"
              />
              {validationErrors.code && (
                <span className="error-text">
                  {validationErrors.code}
                </span>
              )}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth size="lg">
            {user.role === "teacher" && isCreating
              ? "Create Class"
              : "Join Class"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}