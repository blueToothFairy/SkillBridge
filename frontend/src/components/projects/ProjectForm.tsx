'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchTagsApi } from '@/lib/api/tags';
import { createProjectApi, updateProjectApi } from '@/lib/api/projects';
import { Tag, ApiProject } from '@/types';
import { Check, Plus, Trash2, ShieldCheck, ArrowRight, Loader2, Bold, Heading } from 'lucide-react';

interface ProjectFormProps {
  onSuccess?: () => void;
  projectToEdit?: ApiProject;
  onCancel?: () => void;
}

export default function ProjectForm({ onSuccess, projectToEdit, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Tag[]>([]);
  const [skillTags, setSkillTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(true);

  const DEFAULT_DESCRIPTION_TEMPLATE = `### Job Description (JD)\n- [Nhập mô tả chi tiết công việc tại đây]\n\n### Skills\n- [Nhập các kỹ năng yêu cầu tại đây]`;

  // Form Fields
  const [title, setTitle] = useState(projectToEdit ? projectToEdit.title : '');
  const [categoryTagId, setCategoryTagId] = useState(projectToEdit ? projectToEdit.categoryTagId : '');
  const [description, setDescription] = useState(projectToEdit ? projectToEdit.description : DEFAULT_DESCRIPTION_TEMPLATE);
  const [budgetVnd, setBudgetVnd] = useState<number>(projectToEdit ? Number(projectToEdit.budget) : 15000000);
  const [durationWeeks, setDurationWeeks] = useState<number>(projectToEdit ? projectToEdit.durationWeeks : 4);
  const [maxApplicants, setMaxApplicants] = useState<number>(projectToEdit ? projectToEdit.maxApplicants : 5);
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>(projectToEdit ? projectToEdit.requiredSkillTags : []);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertFormat = (formatType: 'bold' | 'heading') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    let before = text.substring(0, start);
    let selected = text.substring(start, end);
    let after = text.substring(end);

    let replacement = '';
    let newCursorPos = start;

    if (formatType === 'bold') {
      if (selected) {
        replacement = `**${selected}**`;
        newCursorPos = start + replacement.length;
      } else {
        replacement = '**chữ in đậm**';
        newCursorPos = start + replacement.length;
      }
    } else if (formatType === 'heading') {
      const lastNewline = before.lastIndexOf('\n');
      if (lastNewline === -1) {
        before = '### ' + before;
        newCursorPos = start + 4;
      } else {
        before = before.substring(0, lastNewline + 1) + '### ' + before.substring(lastNewline + 1);
        newCursorPos = start + 4;
      }
      replacement = selected;
    }

    setDescription(before + replacement + after);

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else if (formatType === 'bold') {
        const selStart = start + 2;
        const selEnd = start + 2 + 11;
        textarea.setSelectionRange(selStart, selEnd);
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  useEffect(() => {
    async function loadTags() {
      try {
        setLoadingTags(true);
        const [catList, skillList] = await Promise.all([
          fetchTagsApi('CATEGORY'),
          fetchTagsApi('SKILL'),
        ]);
        setCategories(catList);
        setSkillTags(skillList);

        if (!categoryTagId && catList.length > 0) {
          setCategoryTagId(catList[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load tags:', err);
      } finally {
        setLoadingTags(false);
      }
    }
    loadTags();
  }, [categoryTagId]);

  const handleToggleSkill = (skillName: string) => {
    if (selectedSkillNames.includes(skillName)) {
      setSelectedSkillNames(selectedSkillNames.filter((s) => s !== skillName));
    } else {
      if (selectedSkillNames.length < 10) {
        setSelectedSkillNames([...selectedSkillNames, skillName]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề dự án');
      return;
    }
    if (!categoryTagId) {
      setErrorMsg('Vui lòng chọn danh mục dự án');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập mô tả chi tiết');
      return;
    }

    setSubmitting(true);
    try {
      if (token) {
        if (projectToEdit) {
          await updateProjectApi(token, projectToEdit.id, {
            title,
            description,
            categoryTagId,
            requiredSkillTags: selectedSkillNames,
            budget: budgetVnd,
            durationWeeks,
            maxApplicants,
          });
          setSuccessMsg('Cập nhật dự án thành công!');
        } else {
          await createProjectApi(token, {
            title,
            description,
            categoryTagId,
            requiredSkillTags: selectedSkillNames,
            budget: budgetVnd,
            durationWeeks,
            maxApplicants,
          });
          setSuccessMsg('Đăng bài dự án thành công!');
        }
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setTimeout(() => {
          router.push('/sme/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-crisp p-6 sm:p-8">
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Tiêu đề bài viết dự án <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Xây dựng Website E-commerce cho Thương hiệu Thời trang"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Danh mục dự án <span className="text-rose-500">*</span>
            </label>
            {loadingTags ? (
              <div className="flex items-center gap-2 py-3 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh mục...
              </div>
            ) : (
              <select
                value={categoryTagId}
                onChange={(e) => setCategoryTagId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Số ứng viên tối đa
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxApplicants}
              onChange={(e) => setMaxApplicants(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
            />
          </div>
        </div>

        {/* Budget & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Ngân sách dự kiến (VND) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step={500000}
              min={1000000}
              value={budgetVnd}
              onChange={(e) => setBudgetVnd(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              {budgetVnd.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Thời gian thực hiện (Tuần) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* Skill Tags selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Kỹ năng yêu cầu (Tối đa 10)
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-[52px]">
            {skillTags.map((skill) => {
              const isSelected = selectedSkillNames.includes(skill.name);
              return (
                <button
                  type="button"
                  key={skill.id}
                  onClick={() => handleToggleSkill(skill.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {skill.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Mô tả chi tiết bài viết <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Hỗ trợ định dạng văn bản nâng cao. Nhấp vào các nút bên dưới để chèn nhanh tiêu đề hoặc in đậm văn bản.
          </p>

          <div className="flex flex-col rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary transition-all">
            {/* Toolbar */}
            <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-3 py-2">
              <button
                type="button"
                onClick={() => handleInsertFormat('bold')}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-md transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="In đậm (Bold)"
              >
                <Bold className="w-3.5 h-3.5 text-slate-700" />
                <span>In đậm</span>
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-1.5" />
              <button
                type="button"
                onClick={() => handleInsertFormat('heading')}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-md transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Tiêu đề (Heading H3)"
              >
                <Heading className="w-3.5 h-3.5 text-slate-700" />
                <span>Tiêu đề H3</span>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nêu rõ yêu cầu dự án, sản phẩm bàn giao mong muốn và tiêu chí đánh giá..."
              className="w-full px-4 py-3 bg-white border-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 transition-all text-xs sm:text-sm font-mono resize-y"
              required
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Ký quỹ đảm bảo thanh toán linh hoạt cho dự án
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-xs"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 disabled:opacity-50 text-white font-medium text-sm transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                {projectToEdit ? 'Lưu thay đổi' : 'Đăng dự án ngay'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
