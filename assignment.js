const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assignment must have a student"],
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Assignment must have a task"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Assignment must belong to a class"],
    },
    status: {
      type: String,
      enum: {
        values: ["not_started", "in_progress", "submitted", "graded"],
        message: "Invalid assignment status",
      },
      default: "not_started",
    },
    submittedAt: Date,
    submission: {
      text: String,
      attachments: [
        {
          url: String,
          filename: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
    grade: {
      points: {
        type: Number,
        min: 0,
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      feedback: String,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    dueDate: Date,
    isLate: Boolean,
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Check if submission is late
assignmentSchema.pre("save", function (next) {
  if (this.submittedAt && this.dueDate) {
    this.isLate = this.submittedAt > this.dueDate;
  }
  next();
});

// Ensure unique student-task combination per class
assignmentSchema.index({ student: 1, task: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
