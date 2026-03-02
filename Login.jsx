import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { Button, Input, Alert, Loading } from "../components/Common";
import { FiMail, FiLock, FiUser } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();
  const { login, register, loading, error, clearError } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Valid email is required";
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!formData.name || formData.name.length < 2) {
        errors.name = "Name must be at least 2 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
    }

    if (result.success) {
      navigate("/dashboard");
    }
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
    if (error) {
      clearError();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">📚 Classroom Spinner</h1>
          <p className="text-blue-100">Smart Classroom Management System</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <Alert
              message={error}
              type="error"
              onClose={clearError}
            />
          )}

          <div className="mb-6">
            <button
              type="button"
              className={`w-full py-2 px-4 font-medium rounded-lg transition ${
                isLogin
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => {
                setIsLogin(true);
                setValidationErrors({});
                clearError();
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`w-full py-2 px-4 font-medium rounded-lg transition mt-2 ${
                !isLogin
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => {
                setIsLogin(false);
                setValidationErrors({});
                clearError();
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input
                  icon={FiUser}
                  label="Full Name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  error={validationErrors.name}
                />

                <div>
                  <label className="label">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </>
            )}

            <Input
              icon={FiMail}
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={validationErrors.email}
            />

            <Input
              icon={FiLock}
              label="Password"
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              error={validationErrors.password}
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={validationErrors.confirmPassword}
              />
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {isLogin && (
            <p className="text-center text-gray-600 text-sm mt-4">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-blue-600 font-medium hover:underline"
              >
                Register here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}