import React, { useState } from 'react';
import { Sun, Sunset, Moon, Clock, Play, GripVertical } from 'lucide-react';
import { Task, TimeBlockSlot } from '../../types';

interface TimeBlockGridProps {
  tasks: Task[];
  onSelectFocusTask: (task: Task) => void;
  onUpdateTimeBlock: (taskId: string, slot: TimeBlockSlot) => void;
}

export const TimeBlockGrid: React.FC<TimeBlockGridProps> = ({
  tasks,
  onSelectFocusTask,
  onUpdateTimeBlock,
}) => {
  const [draggedOverSlot, setDraggedOverSlot] = useState<TimeBlockSlot | null>(null);

  const blocks: { slot: TimeBlockSlot; label: string; icon: React.ElementType; color: string }[] = [
    { slot: 'morning', label: 'Morning Block (08:00 - 12:00)', icon: Sun, color: 'text-[#CFA052]' },
    { slot: 'afternoon', label: 'Afternoon Block (13:00 - 17:00)', icon: Sunset, color: 'text-[#C06C4C]' },
    { slot: 'evening', label: 'Evening Block (18:00 - 21:00)', icon: Moon, color: 'text-[#C87D87]' },
  ];

  const handleDragOver = (e: React.DragEvent, slot: TimeBlockSlot) => {
    e.preventDefault();
    if (draggedOverSlot !== slot) {
      setDraggedOverSlot(slot);
    }
  };

  const handleDrop = (e: React.DragEvent, slot: TimeBlockSlot) => {
    e.preventDefault();
    setDraggedOverSlot(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTimeBlock(taskId, slot);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
            Today's Time-Block Schedule Grid
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Drag and drop tasks between Morning, Afternoon, and Evening blocks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {blocks.map(({ slot, label, icon: Icon, color }) => {
          const slotTasks = tasks.filter((t) => t.isTodayFocus && t.timeBlock === slot);
          const totalEst = slotTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0);
          const isOver = draggedOverSlot === slot;

          return (
            <div
              key={slot}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDragLeave={() => setDraggedOverSlot(null)}
              onDrop={(e) => handleDrop(e, slot)}
              className={`flex flex-col rounded-2xl border transition-all p-4 shadow-xs ${
                isOver
                  ? 'border-2 border-[#CFA052] bg-[#CFA052]/10 scale-[1.01]'
                  : 'border-[var(--border-subtle)] bg-[var(--card-surface)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                    {slot === 'morning' ? 'Morning' : slot === 'afternoon' ? 'Afternoon' : 'Evening'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {totalEst}m total
                </span>
              </div>

              {/* Task Items in Block */}
              <div className="flex-1 space-y-2.5 min-h-[140px]">
                {slotTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)]/60 p-4 text-center text-[11px] text-[var(--text-muted)]">
                    {isOver ? 'Drop task here to schedule' : `No tasks scheduled for ${slot}`}
                  </div>
                ) : (
                  slotTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      className={`group flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2.5 text-xs transition-all hover:border-[#CFA052] cursor-grab active:cursor-grabbing ${
                        task.completed ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-50 group-hover:opacity-100 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {task.estimatedMinutes || 25} mins
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectFocusTask(task)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#CFA052]/15 text-[#CFA052] opacity-80 group-hover:opacity-100 transition-all hover:scale-105"
                        title="Start Pomodoro Focus"
                      >
                        <Play className="h-3.5 w-3.5 fill-[#CFA052]" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

