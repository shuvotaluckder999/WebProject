const router = require("express").Router();
const { body, validationResult, param } = require("express-validator");
const Assignment = require("../models/Assignment");
const Task = require("../models/Task");
const Class = require("../models/Class");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/Auth");

// @route   GET /api/assignment/my/:classId
// @desc    Get assignments for student in a specific class
// @access  Private
router.get(
  "/my/:classId",
  protect,
  param("classId").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      const assignments = await Assignment.find({
        classId: req.params.classId,
        student: req.user.id,
      })
        .populate({
          path: "task",
          select: "title description dueDate difficulty points type",
        })
        .populate("classId", "name")
        .sort("-createdAt");

      res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
      });
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      next(error);
    }
  }
);

// @route   GET /api/assignment/class/:classId
// @desc    Get all assignments for a class (Teacher only)
// @access  Private
router.get(
  "/class/:classId",
  protect,
  param("classId").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      const cls = await Class.findById(req.params.classId);

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check authorization
      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view assignments for this class",
        });
      }

      const assignments = await Assignment.find({ classId: req.params.classId })
        .populate("student", "name email avatar")
        .populate("task", "title type points difficulty")
        .sort("-createdAt");

      res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
      });
    } catch (error) {
      console.error("Error fetching class assignments:", error);
      next(error);
    }
  }
);

// @route   GET /api/assignment/task/:taskId
// @desc    Get assignments for a specific task (Teacher only)
// @access  Private
router.get(
  "/task/:taskId",
  protect,
  param("taskId").isMongoId().withMessage("Invalid task ID"),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      const cls = await Class.findById(task.classId);
      
      // Check authorization
      if (!cls || (cls.teacher.toString() !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view assignments for this task",
        });
      }

      const assignments = await Assignment.find({ task: req.params.taskId })
        .populate("student", "name email avatar")
        .populate("task", "title type points difficulty")
        .sort("-createdAt");

      res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
      });
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      next(error);
    }
  }
);

// @route   GET /api/assignment/:id
// @desc    Get single assignment
// @access  Private
router.get(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid assignment ID"),
  async (req, res, next) => {
    try {
      const assignment = await Assignment.findById(req.params.id)
        .populate("student", "name email avatar")
        .populate("task")
        .populate("classId")
        .populate("grade.gradedBy", "name avatar");

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Check access
      const isStudent = assignment.student._id.toString() === req.user.id;
      const isTeacher = assignment.classId.teacher.toString() === req.user.id;

      if (!isStudent && !isTeacher && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this assignment",
        });
      }

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      next(error);
    }
  }
);

// @route   POST /api/assignment/:id/submit
// @desc    Submit assignment
// @access  Private
router.post(
  "/:id/submit",
  protect,
  param("id").isMongoId().withMessage("Invalid assignment ID"),
  [
    body("submission.text")
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage("Submission text cannot exceed 5000 characters"),
    body("submission.attachments")
      .optional()
      .isArray()
      .withMessage("Attachments must be an array"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      let assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Check authorization
      if (assignment.student.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to submit this assignment",
        });
      }

      // Check if already submitted
      if (assignment.status === "submitted" || assignment.status === "graded") {
        if (assignment.attempts >= (assignment.maxAttempts || 3)) {
          return res.status(400).json({
            success: false,
            message: "Maximum submission attempts exceeded",
          });
        }
      }

      // Check if late
      const now = new Date();
      const isLate = assignment.dueDate && now > assignment.dueDate;

      // Update assignment
      assignment.submission = {
        text: req.body.submission?.text || "",
        attachments: req.body.submission?.attachments || [],
        submittedAt: now
      };
      assignment.submittedAt = now;
      assignment.status = "submitted";
      assignment.isLate = isLate;
      assignment.attempts = (assignment.attempts || 0) + 1;

      assignment = await assignment.save();

      const populated = await Assignment.findById(assignment._id)
        .populate("student", "name email")
        .populate("task");

      res.status(200).json({
        success: true,
        message: isLate
          ? "Assignment submitted (Late)"
          : "Assignment submitted successfully",
        data: populated,
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      next(error);
    }
  }
);

// @route   POST /api/assignment/:id/grade
// @desc    Grade assignment (Teacher only)
// @access  Private
router.post(
  "/:id/grade",
  protect,
  authorize("teacher", "admin"),
  param("id").isMongoId().withMessage("Invalid assignment ID"),
  [
    body("grade.points")
      .isInt({ min: 0 })
      .withMessage("Invalid points value"),
    body("grade.feedback")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Feedback cannot exceed 2000 characters"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      let assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Get task to know max points
      const task = await Task.findById(assignment.task);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Associated task not found",
        });
      }

      // Validate points
      if (req.body.grade.points > task.points) {
        return res.status(400).json({
          success: false,
          message: `Points cannot exceed ${task.points}`,
        });
      }

      // Update grading
      assignment.grade = {
        points: req.body.grade.points,
        percentage: (req.body.grade.points / task.points) * 100,
        feedback: req.body.grade.feedback || "",
        gradedAt: new Date(),
        gradedBy: req.user.id,
      };
      assignment.status = "graded";

      assignment = await assignment.save();

      const populated = await Assignment.findById(assignment._id)
        .populate("student", "name email")
        .populate("task")
        .populate("grade.gradedBy", "name avatar");

      res.status(200).json({
        success: true,
        message: "Assignment graded successfully",
        data: populated,
      });
    } catch (error) {
      console.error("Error grading assignment:", error);
      next(error);
    }
  }
);

// @route   POST /api/assignment/spin/:classId
// @desc    Randomly assign tasks to students (Spinner feature)
// @access  Private (Teacher only)
router.post(
  "/spin/:classId",
  protect,
  authorize("teacher", "admin"),
  param("classId").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      const cls = await Class.findById(req.params.classId).populate("students");

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check authorization
      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }

      const tasks = await Task.find({
        classId: req.params.classId,
        status: "published",
      });

      if (tasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No published tasks available to assign",
        });
      }

      if (!cls.students || cls.students.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No students in this class",
        });
      }

      const results = [];

      for (let student of cls.students) {
        // Pick random task
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

        // Check if assignment already exists
        let assignment = await Assignment.findOne({
          student: student._id,
          task: randomTask._id,
          classId: req.params.classId,
        });

        if (!assignment) {
          assignment = await Assignment.create({
            student: student._id,
            task: randomTask._id,
            classId: req.params.classId,
            dueDate: randomTask.dueDate,
            status: "assigned",
            assignedAt: new Date(),
          });
        }

        results.push(assignment._id);
      }

      const populated = await Assignment.find({ _id: { $in: results } })
        .populate("student", "name email")
        .populate("task", "title difficulty points");

      res.status(200).json({
        success: true,
        message: "Tasks assigned randomly",
        count: populated.length,
        data: populated,
      });
    } catch (error) {
      console.error("Error spinning assignments:", error);
      next(error);
    }
  }
);

// @route   POST /api/assignment/spin/task/:taskId
// @desc    Assign a specific task to all students (Alternative spinner)
// @access  Private (Teacher only)
router.post(
  "/spin/task/:taskId",
  protect,
  authorize("teacher", "admin"),
  param("taskId").isMongoId().withMessage("Invalid task ID"),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      const cls = await Class.findById(task.classId).populate("students");

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check authorization
      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }

      if (!cls.students || cls.students.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No students in this class",
        });
      }

      const results = [];

      for (let student of cls.students) {
        // Check if assignment already exists
        let assignment = await Assignment.findOne({
          student: student._id,
          task: task._id,
          classId: task.classId,
        });

        if (!assignment) {
          assignment = await Assignment.create({
            student: student._id,
            task: task._id,
            classId: task.classId,
            dueDate: task.dueDate,
            status: "assigned",
            assignedAt: new Date(),
          });
        }

        results.push(assignment._id);
      }

      const populated = await Assignment.find({ _id: { $in: results } })
        .populate("student", "name email")
        .populate("task", "title difficulty points");

      res.status(200).json({
        success: true,
        message: "Task assigned to all students",
        count: populated.length,
        data: populated,
      });
    } catch (error) {
      console.error("Error assigning task to all students:", error);
      next(error);
    }
  }
);

// @route   DELETE /api/assignment/:id
// @desc    Delete assignment (Teacher only)
// @access  Private
router.delete(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid assignment ID"),
  async (req, res, next) => {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Get class to check authorization
      const cls = await Class.findById(assignment.classId);
      if (!cls || (cls.teacher.toString() !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this assignment",
        });
      }

      await Assignment.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      next(error);
    }
  }
);

module.exports = router;
