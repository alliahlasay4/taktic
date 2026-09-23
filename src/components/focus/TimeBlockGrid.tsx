import React, { useState } from 'react';
import { Sun, Sunset, Moon, Clock, Play, GripVertical, Plus, Check } from 'lucide-react';
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
  const [assigningSlot, setAssigningSlot] = useState<TimeBlockSlot | null>(null);

  const blocks: { slot: TimeBlockSlot; label: string; icon: React.ElementType; color: string; badgeColor: string }[] = [
    { 
      slot: 'morning', 
      label: 'Morning Block (08:00 - 12:00)', 
      icon: Sun, 
      color: 'text-[var(--accent-warm-ochre)]',
      badgeColor: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border-[var(--accent-warm-ochre)]/30'
    },
    { 
      slot: 'afternoon', 
      label: 'Afternoon Block (13:00 - 17:00)', 
      icon: Sunset, 
      color: 'text-[var(--accent-terracotta)]',
      badgeColor: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/30'
    },
    { 
      slot: 'evening', 
      label: 'Evening Block (18:00 - 21:00)', 
      icon: Moon, 
      color: 'text-[var(--accent-dusty-rose)]',
      badgeColor: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border-[var(--accent-dusty-rose)]/30'
    },
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
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] tracking-tight">
            Today's Time-Block Schedule Grid
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Organize focus tasks across blocks. Drag and drop between Morning, Afternoon, and Evening.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {blocks.map(({ slot, label, icon: Icon, color, badgeColor }) => {
          const slotTasks = tasks.filter((t) => t.isTodayFocus && t.timeBlock === slot);
          const totalEst = slotTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0);
          const isOver = draggedOverSlot === slot;
          const availableToAssign = tasks.filter((t) => t.timeBlock !== slot && !t.completed);

          return (
            <div
              key={slot}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDragLeave={() => setDraggedOverSlot(null)}
              onDrop={(e) => handleDrop(e, slot)}
              className={`flex flex-col rounded-2xl border transition-all p-4 shadow-xs min-h-[320px] ${
                isOver
                  ? 'border-2 border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 scale-[1.01]'
                  : 'border-[var(--border-subtle)] bg-[var(--card-surface)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} />
                  <span className="font-heading font-bold text-xs text-[var(--text-primary)] capitalize">
                    {slot}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {slotTasks.length} {slotTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                
                <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                  {totalEst}m
                </span>
              </div>

              {/* Task Items in Block */}
              <div className="flex-1 space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                {slotTasks.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)]/60 p-4 text-center text-[11px] text-[var(--text-muted)]">
                    <p>{isOver ? 'Drop task here to schedule' : `No tasks scheduled for ${slot}`}</p>
                    <p className="text-[10px] text-[var(--text-muted)] opacity-80 mt-1">Drag a task or click assign below</p>
                  </div>
                ) : (
                  slotTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      className={`group flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2.5 text-xs transition-all hover:border-[var(--accent-terracotta)]/50 hover:shadow-2xs cursor-grab active:cursor-grabbing ${
                        task.completed ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-40 group-hover:opacity-100 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                            <span className="font-mono">{task.estimatedMinutes || 25} mins</span>
                            {task.priority && (
                              <span className={`capitalize font-medium ${
                                task.priority === 'high' ? 'text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)]'
                              }`}>
                                • {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectFocusTask(task)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] opacity-80 group-hover:opacity-100 transition-all hover:scale-105 shrink-0 cursor-pointer"
                        title="Start Focus on this task"
                        aria-label={`Start Focus on ${task.title}`}
                      >
                        <Play className="h-3.5 w-3.5 fill-[var(--accent-terracotta)]" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Assign / Move Task to this Block */}
              <div className="relative mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                {assigningSlot === slot ? (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setAssigningSlot(null)} />
                    <div className="absolute bottom-full left-0 right-0 mb-1 z-30 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xl p-2 max-h-48 overflow-y-auto space-y-1 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between pb-1 px-1 border-b border-[var(--border-subtle)] font-semibold text-[10px] text-[var(--text-muted)] uppercase">
                        <span>Assign Task to {slot}</span>
                        <button type="button" onClick={() => setAssigningSlot(null)} className="cursor-pointer p-0.5 hover:text-[var(--text-primary)]">✕</button>
                      </div>
                      {availableToAssign.length === 0 ? (
                        <p className="text-[11px] text-[var(--text-muted)] p-2 text-center">No other tasks available</p>
                      ) : (
                        availableToAssign.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              onUpdateTimeBlock(t.id, slot);
                              setAssigningSlot(null);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-[var(--card-hover)] flex items-center justify-between text-[11px] text-[var(--text-primary)] transition cursor-pointer"
                          >
                            <span className="truncate mr-2 font-medium">{t.title}</span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">{t.estimatedMinutes || 25}m</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAssigningSlot(slot)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-terracotta)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Assign Task to {slot}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
