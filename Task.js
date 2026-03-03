const router = require("express").Router();
const { body, validationResult, param, query } = require("express-validator");
const Task = require("../models/Task");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");
const { protect, authorize } = require("../middleware/Auth");

// @route   GET /api/task/class/:classId
// @desc    Get all tasks for a class
// @access  Private
router.get(
  "/class/:classId",
  protect,
  param("classId").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      const { status, sortBy } = req.query;

      // Check if user has access to class
      const cls = await Class.findById(req.params.classId);
      if (
        !cls ||
        (cls.teacher.toString() !== req.user.id &&
          !cls.students.includes(req.user.id) &&
          req.user.role !== "admin")
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this class",
        });
      }

      let query = { classId: req.params.classId };

      if (status) {
        query.status = status;
      }

      let tasks = await Task.find(query)
        .populate("createdBy", "name avatar")
        .populate("classId", "name");

      // Sort options
      if (sortBy === "dueDate") {
        tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      } else if (sortBy === "difficulty") {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        tasks.sort(
          (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
      } else {
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/task/:id
// @desc    Get single task
// @access  Private
router.get(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid task ID"),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate("createdBy", "name email avatar")
        .populate("classId", "name teacher");

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/task
// @desc    Create new task (Teacher/Admin only)
// @access  Private
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  [
    body("title")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be at least 3 characters"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("classId").isMongoId().withMessage("Invalid class ID"),
    body("dueDate")
      .isISO8601()
      .withMessage("Invalid due date format")
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("Due date must be in the future");
        }
        return true;
      }),
    body("difficulty")
      .isIn(["easy", "medium", "hard"])
      .withMessage("Invalid difficulty level"),
    body("type")
      .isIn(["assignment", "quiz", "project", "homework"])
      .withMessage("Invalid task type"),
    body("points")
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage("Points must be between 0 and 1000"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        classId,
        dueDate,
        difficulty,
        type,
        points,
        estimatedTime,
        rubric,
      } = req.body;

      // Verify teacher has access to class
      const cls = await Class.findById(classId);
      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to create tasks for this class",
        });
      }

      // Create task
      const task = await Task.create({
        title,
        description,
        classId,
        dueDate,
        difficulty,
        type,
        points: points || 100,
        estimatedTime,
        rubric,
        createdBy: req.user.id,
        status: "draft",
      });

      if (!task) {
        return res.status(500).json({
          success: false,
          message: "Failed to create task",
        });
      }

      // CORRECTION: Remplacer execPopulate() par findById avec populate
      const populatedTask = await Task.findById(task._id)
        .populate("createdBy", "name avatar")
        .populate("classId", "name");

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: populatedTask,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      next(error);
    }
  }
);

// @route   PUT /api/task/:id
// @desc    Update task (Teacher/Admin only)
// @access  Private
router.put(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid task ID"),
  async (req, res, next) => {
    try {
      let task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check authorization
      if (task.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this task",
        });
      }

      // Update allowed fields
      const fieldsToUpdate = [
        "title",
        "description",
        "difficulty",
        "dueDate",
        "points",
        "estimatedTime",
        "status",
        "attachments",
        "rubric",
        "emoji",
        "isPublished",
      ];

      fieldsToUpdate.forEach((field) => {
        if (req.body[field] !== undefined) {
          task[field] = req.body[field];
        }
      });

      task = await task.save();

      // If publishing, create assignments for all students
      if (req.body.isPublished && !task.isPublished) {
        const cls = await Class.findById(task.classId);
        if (cls && cls.students && cls.students.length > 0) {
          for (const studentId of cls.students) {
            // Check if assignment already exists
            const existingAssignment = await Assignment.findOne({
              student: studentId,
              task: task._id,
              classId: task.classId,
            });
            
            if (!existingAssignment) {
              await Assignment.create({
                student: studentId,
                task: task._id,
                classId: task.classId,
                dueDate: task.dueDate,
                status: "assigned",
              });
            }
          }
        }
      }

      const updatedTask = await Task.findById(task._id)
        .populate("createdBy", "name avatar")
        .populate("classId", "name");

      res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      next(error);
    }
  }
);

// @route   DELETE /api/task/:id
// @desc    Delete task (Teacher/Admin only)
// @access  Private
router.delete(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid task ID"),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check authorization
      if (task.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this task",
        });
      }

      // Delete all assignments for this task
      await Assignment.deleteMany({ task: req.params.id });

      await Task.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      next(error);
    }
  }
);

module.exports = router;