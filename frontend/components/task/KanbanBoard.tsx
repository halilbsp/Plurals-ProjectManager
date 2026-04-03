"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Plus, AlignLeft, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  createTask,
  getTasks,
  updateTask,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/api/task";
import { useProjectContext } from "@/context/ProjectContext";

import TaskModal from "./TaskModal";

const priorityBadge: Record<TaskPriority, string> = {
  high: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20",
  medium: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20",
  low: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20",
};

const columnMeta: Record<TaskStatus, { label: string; badge: string }> = {
  todo: { label: "Todo", badge: "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300" },
  doing: { label: "In Progress", badge: "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  done: { label: "Completed", badge: "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400" },
};

export default function KanbanBoard() {
  const { selectedProjectId } = useProjectContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTasks(selectedProjectId);
      setTasks(data || []);
    } catch (error) {
      console.error("Tasks could not be loaded:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setSelected(null);
    void load();
  }, [isMounted, load]);

  const handleCreateTask = async () => {
    const title = window.prompt("Enter the new task title");
    if (!title?.trim()) return;

    setIsCreating(true);
    try {
      await createTask({
        title: title.trim(),
        project_id: selectedProjectId,
        status: "todo",
        priority: "medium",
      });
      await load();
    } catch (error) {
      console.error("The new task could not be created:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const id = Number(result.draggableId);
    const newStatus = result.destination.droppableId as TaskStatus;
    const oldStatus = result.source.droppableId as TaskStatus;

    if (newStatus === oldStatus) return;

    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(id, { status: newStatus });
    } catch (error) {
      setTasks(previousTasks);
      console.error("Status update failed.", error);
    }
  };

  if (!isMounted) return null;

  const renderColumn = (status: TaskStatus) => {
    const list = tasks.filter((t) => t.status === status);
    const meta = columnMeta[status];

    return (
      <div className="flex flex-col gap-4">
        {/* Column Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-gray-700 dark:text-gray-200">{meta.label}</h2>
          <span className={`${meta.badge} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
            {list.length}
          </span>
        </div>

        {/* Drop Zone */}
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`border p-3 rounded-2xl min-h-[420px] transition-colors ${
                snapshot.isDraggingOver
                  ? "bg-purple-50/40 dark:bg-purple-500/5 border-purple-200 dark:border-purple-500/20"
                  : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/10"
              }`}
            >
              {isLoading && list.length === 0 && (
                <div className="text-sm font-medium text-gray-400 dark:text-gray-500 p-2">
                  Loading tasks...
                </div>
              )}

              {!isLoading &&
                list.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(draggableProvided) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        className="bg-white dark:bg-[#1E1A2E] p-4 rounded-[18px] mb-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/10 cursor-grab active:cursor-grabbing hover:shadow-[0_6px_20px_rgba(52,36,122,0.08)] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:border-purple-200 dark:hover:border-purple-500/20 transition-all group"
                        onClick={() => setSelected(task)}
                      >
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1 group-hover:text-[#34247A] dark:group-hover:text-[#7C5DFA] transition-colors leading-snug">
                          {task.title}
                        </div>

                        {task.description && (
                          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-3">
                            <AlignLeft size={12} />
                            <span className="text-[11px] truncate">{task.description}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${priorityBadge[task.priority] || priorityBadge.medium}`}>
                            {task.priority}
                          </span>

                          {task.due_date && (
                            <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[11px]">
                              <Clock size={11} />
                              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

              {!isLoading && list.length === 0 && (
                <div className="text-sm text-gray-400 dark:text-gray-500 p-2">
                  No tasks in this stage yet.
                </div>
              )}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kanban Board</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Live tasks are loaded from FastAPI and synced on drag-and-drop.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-[#34247A] hover:bg-[#2A1D63] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-purple-900/10 active:scale-95 disabled:opacity-60"
          onClick={handleCreateTask}
          disabled={isCreating}
        >
          <Plus size={18} />
          {isCreating ? "Adding..." : "Add New Task"}
        </button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {(["todo", "doing", "done"] as TaskStatus[]).map((status) => (
            <div key={status}>{renderColumn(status)}</div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      {selected && (
        <TaskModal task={selected} reload={load} onClose={() => setSelected(null)} />
      )}
    </>
  );
}