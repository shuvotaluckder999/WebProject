import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2";

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantStyles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg disabled:bg-blue-400",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg disabled:bg-red-400",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-300",
    ghost: "text-blue-600 hover:bg-blue-50 disabled:text-gray-300",
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="spinner w-4 h-4" />}
      {children}
    </button>
  );
};

export const Card = ({ children, className = "", ...props }) => (
  <div
    className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const Input = ({ label, error, icon: Icon, ...props }) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      )}
      <input
        className={`input ${Icon ? "pl-10" : ""} ${error ? "border-red-500 focus:ring-red-500" : ""}`}
        {...props}
      />
    </div>
    {error && <span className="error-text">{error}</span>}
  </div>
);

export const Select = ({ label, options, error, ...props }) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <select
      className={`input ${error ? "border-red-500 focus:ring-red-500" : ""}`}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <span className="error-text">{error}</span>}
  </div>
);

export const Badge = ({ children, variant = "primary" }) => {
  const styles = {
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

export const Alert = ({ message, type = "info", onClose }) => {
  const styles = {
    info: "bg-blue-50 border border-blue-200 text-blue-800",
    success: "bg-green-50 border border-green-200 text-green-800",
    warning: "bg-yellow-50 border border-yellow-200 text-yellow-800",
    error: "bg-red-50 border border-red-200 text-red-800",
  };

  return (
    <div className={`p-4 rounded-lg ${styles[type]} flex justify-between items-center`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-lg font-bold">
          ×
        </button>
      )}
    </div>
  );
};

export const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full spinner"></div>
  </div>
);

export const Modal = ({ isOpen, title, children, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex gap-3 border-t p-6 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {onConfirm && (
            <Button variant="primary" onClick={onConfirm}>
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
