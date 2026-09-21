import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle, Save, Repeat, Zap } from 'lucide-react';
import { Task } from '../../types';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updatedFields: Partial<Task>) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<Task['recurring']>(undefined);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(25);
  const [isTodayFocus, setIsTodayFocus] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate || '');
      setRecurring(task.recurring || undefined);
      setEstimatedMinutes(task.estimatedMinutes || 25);
      setIsTodayFocus(task.isTodayFocus || false);
      setTags(task.tags || []);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      recurring: recurring || undefined,
      estimatedMinutes: estimatedMinutes || undefined,
      isTodayFocus,
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-800 bg-[var(--bg-card,#121824)] p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✏️</span> Edit Task
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name"
              className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details, links, or notes..."
              className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Grid Options: Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Grid Options: Estimated Time & Recurring */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Estimated Focus (Mins)</label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={estimatedMinutes || ''}
                onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="25"
                className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Repeat Cycle</label>
              <select
                value={recurring || ''}
                onChange={(e) => setRecurring((e.target.value as Task['recurring']) || undefined)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
              >
                <option value="">None (One-time)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Today's Focus Toggle */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${isTodayFocus ? 'text-amber-400' : 'text-gray-500'}`} />
              <span className="text-xs font-semibold text-white">Add to Today's Focus Queue</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTodayFocus(!isTodayFocus)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isTodayFocus ? 'bg-amber-400' : 'bg-gray-800'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                  isTodayFocus ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Tags (Press Enter)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="e.g. project, urgent"
              className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none transition mb-2"
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2 py-1 text-[11px] font-medium text-emerald-400"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-400 transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
