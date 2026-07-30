'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchTagsApi } from '@/lib/api/tags';
import { createProjectApi, updateProjectApi } from '@/lib/api/projects';
import { Tag, ApiProject } from '@/types';
import { parseMarkdown } from '@/lib/markdown';
import {
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Bold,
  Heading,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface ProjectFormProps {
  onSuccess?: () => void;
  projectToEdit?: ApiProject;
  onCancel?: () => void;
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return '<div><br></div>';
  return markdown
    .split('\n')
    .map((line) => {
      let content = line;
      let headerLevel = 0;
      const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        headerLevel = headerMatch[1].length;
        content = headerMatch[2];
      }

      // Replace bold markdown with HTML strong tag
      content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/__([^_]+)__/g, '<strong>$1</strong>');

      if (headerLevel > 0) {
        return `<h${headerLevel}>${content}</h${headerLevel}>`;
      }
      if (content.trim() === '') {
        return '<div><br></div>';
      }
      return `<div>${content}</div>`;
    })
    .join('');
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  const markdownLines: string[] = [];

  const processNode = (node: Node): string => {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      return node.textContent || '';
    }

    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      let childContent = '';
      el.childNodes.forEach((child) => {
        childContent += processNode(child);
      });

      if (tagName === 'strong' || tagName === 'b') {
        return `**${childContent}**`;
      }
      return childContent;
    }

    return '';
  };

  body.childNodes.forEach((node) => {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      const text = node.textContent || '';
      if (text.trim()) {
        markdownLines.push(text);
      }
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      let innerText = '';
      el.childNodes.forEach((child) => {
        innerText += processNode(child);
      });

      if (tagName === 'h1') {
        markdownLines.push(`# ${innerText}`);
      } else if (tagName === 'h2') {
        markdownLines.push(`## ${innerText}`);
      } else if (tagName === 'h3') {
        markdownLines.push(`### ${innerText}`);
      } else if (tagName === 'h4') {
        markdownLines.push(`#### ${innerText}`);
      } else if (tagName === 'h5') {
        markdownLines.push(`##### ${innerText}`);
      } else if (tagName === 'h6') {
        markdownLines.push(`###### ${innerText}`);
      } else if (tagName === 'br') {
        markdownLines.push('');
      } else if (tagName === 'div' || tagName === 'p') {
        if (el.innerHTML === '<br>' || el.innerHTML === '<div><br></div>' || el.innerHTML === '<p><br></p>') {
          markdownLines.push('');
        } else {
          markdownLines.push(innerText);
        }
      } else {
        if (innerText.trim() || markdownLines.length > 0) {
          markdownLines.push(innerText);
        }
      }
    }
  });

  return markdownLines.join('\n');
}

export default function ProjectForm({ onSuccess, projectToEdit, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const { token } = useAuth();

  const [categories, setCategories] = useState<Tag[]>([]);
  const [skillTags, setSkillTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(true);

  const DEFAULT_DESCRIPTION_TEMPLATE = `### Job Description (JD)\n- [Nhập mô tả chi tiết công việc tại đây]\n\n### Skills\n- [Nhập các kỹ năng yêu cầu tại đây]`;

  // Step state
  const [step, setStep] = useState<number>(1);

  // Step 1: Basic Info Fields
  const [title, setTitle] = useState(projectToEdit ? projectToEdit.title : '');
  const [categoryTagId, setCategoryTagId] = useState(projectToEdit ? projectToEdit.categoryTagId : '');
  const [description, setDescription] = useState(projectToEdit ? projectToEdit.description : DEFAULT_DESCRIPTION_TEMPLATE);
  const [durationWeeks, setDurationWeeks] = useState<number>(projectToEdit ? projectToEdit.durationWeeks : 4);
  const [maxApplicants, setMaxApplicants] = useState<number>(projectToEdit ? projectToEdit.maxApplicants : 4);
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>(projectToEdit ? projectToEdit.requiredSkillTags : []);

  // Step 2: Milestones list state
  const [milestones, setMilestones] = useState<{
    title: string;
    description: string;
    deadline: string;
    amountVnd: number;
  }[]>(
    projectToEdit?.milestones
      ? projectToEdit.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        deadline: new Date(m.deadline).toISOString().substring(0, 10),
        amountVnd: Number(m.amountVnd),
      }))
      : []
  );

  // New Milestone Form inputs
  const [newMTitle, setNewMTitle] = useState('');
  const [newMDesc, setNewMDesc] = useState('');
  const [newMDeadline, setNewMDeadline] = useState('');
  const [newMAmount, setNewMAmount] = useState<number>(1000000);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Initialize contenteditable innerHTML from description state once on mount or step change
  useEffect(() => {
    if (step === 1 && editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = markdownToHtml(description);
      isInitializedRef.current = true;
    }
    if (step !== 1) {
      isInitializedRef.current = false;
    }
  }, [step, description]);

  const handleEditorInput = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.innerHTML;
    const markdown = htmlToMarkdown(html);
    setDescription(markdown);
  };

  const handleInsertFormat = (formatType: 'bold' | 'heading') => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    if (formatType === 'bold') {
      document.execCommand('bold', false);
    } else if (formatType === 'heading') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let parent = selection.anchorNode;
        let isHeading = false;
        while (parent && parent !== editor) {
          if (parent.nodeName === 'H3') {
            isHeading = true;
            break;
          }
          parent = parent.parentNode;
        }
        if (isHeading) {
          document.execCommand('formatBlock', false, '<div>');
        } else {
          document.execCommand('formatBlock', false, '<h3>');
        }
      } else {
        document.execCommand('formatBlock', false, '<h3>');
      }
    }

    // Sync input
    handleEditorInput();
  };

  // Dynamic budget calculation (Sum of all milestones budget)
  const totalBudget = milestones.reduce((sum, m) => sum + Number(m.amountVnd), 0);

  // Dynamic duration in weeks & maximum deadline calculation
  const calculatedDurationWeeks = (() => {
    if (milestones.length === 0) return 4;
    const deadlines = milestones.map((m) => new Date(m.deadline).getTime());
    const maxTime = Math.max(...deadlines);
    const minTime = Math.min(...deadlines);
    const diffTime = maxTime - minTime;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  })();

  const calculatedDeadline = (() => {
    if (milestones.length === 0) return new Date().toISOString();
    const deadlines = milestones.map((m) => new Date(m.deadline).getTime());
    const maxTime = Math.max(...deadlines);
    return new Date(maxTime).toISOString();
  })();

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

  const handleAddMilestone = () => {
    setErrorMsg(null);
    if (!newMTitle.trim()) {
      setErrorMsg('Vui lòng điền tiêu đề cột mốc');
      return;
    }
    if (!newMDesc.trim()) {
      setErrorMsg('Vui lòng điền mô tả cột mốc');
      return;
    }
    if (!newMDeadline) {
      setErrorMsg('Vui lòng chọn hạn chót cột mốc');
      return;
    }
    const msDeadline = new Date(newMDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    if (msDeadline.getTime() < today.getTime()) {
      setErrorMsg('Hạn chót cột mốc phải ở tương lai');
      return;
    }
    if (newMAmount <= 0) {
      setErrorMsg('Số tiền thanh toán phải lớn hơn 0');
      return;
    }

    setMilestones([
      ...milestones,
      {
        title: newMTitle.trim(),
        description: newMDesc.trim(),
        deadline: newMDeadline,
        amountVnd: Number(newMAmount),
      },
    ]);

    // Reset inputs
    setNewMTitle('');
    setNewMDesc('');
    setNewMDeadline('');
    setNewMAmount(1000000);
  };

  const handleDeleteMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleNextStep = () => {
    setErrorMsg(null);
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
    setStep(2);
  };

  const handleNextToStep3 = () => {
    setErrorMsg(null);
    if (milestones.length === 0) {
      setErrorMsg('Dự án phải có ít nhất 1 cột mốc thanh toán');
      return;
    }
    if (calculatedDurationWeeks < 1 || calculatedDurationWeeks > 8) {
      setErrorMsg(`Tổng thời gian thực hiện dự án (${calculatedDurationWeeks} tuần) phải từ 1 đến 8 tuần. Vui lòng điều chỉnh lại hạn chót các cột mốc.`);
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (milestones.length === 0) {
      setErrorMsg('Dự án phải có ít nhất 1 cột mốc thanh toán');
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
            budget: totalBudget,
            durationWeeks: calculatedDurationWeeks,
            maxApplicants,
            deadline: calculatedDeadline,
            milestones,
          });
          setSuccessMsg('Cập nhật dự án thành công!');
        } else {
          await createProjectApi(token, {
            title,
            description,
            categoryTagId,
            requiredSkillTags: selectedSkillNames,
            budget: totalBudget,
            durationWeeks: calculatedDurationWeeks,
            maxApplicants,
            deadline: calculatedDeadline,
            milestones,
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

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Progress Steps Indicator */}
      <div className="flex items-center justify-center gap-4 max-w-lg mx-auto py-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1 ? 'bg-brand-primary text-white scale-110 shadow-xs' : 'bg-emerald-500 text-white'
              }`}
          >
            {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
          </span>
          <span className={`text-xs font-semibold transition-colors duration-300 ${step === 1 ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
            Thông tin cơ bản
          </span>
        </div>
        <div className={`h-[1px] w-8 transition-colors duration-300 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div className="flex items-center gap-1.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 2 ? 'bg-brand-primary text-white scale-110 shadow-xs' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}
          >
            {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
          </span>
          <span className={`text-xs font-semibold transition-colors duration-300 ${step === 2 ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
            Cột mốc & Ký quỹ
          </span>
        </div>
        <div className={`h-[1px] w-8 transition-colors duration-300 ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <div className="flex items-center gap-1.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 3 ? 'bg-brand-primary text-white scale-110 shadow-xs' : 'bg-slate-200 text-slate-500'
              }`}
          >
            3
          </span>
          <span className={`text-xs font-semibold transition-colors duration-300 ${step === 3 ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
            Xem lại & Gửi
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-crisp p-6 sm:p-8 bg-white">
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
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
                    <Loader2 className="w-4 h-4 animate-spin animate-infinite" /> Đang tải danh mục...
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
                  Số ứng viên tối đa (1–4)
                </label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={maxApplicants}
                  onChange={(e) => setMaxApplicants(Math.min(4, Math.max(1, Number(e.target.value))))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm"
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isSelected
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
                Mô tả chi tiết dự án <span className="text-rose-500">*</span>
              </label>

              <div className="flex flex-col rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary transition-all">
                {/* Toolbar */}
                <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('bold')}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-md transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="In đậm"
                  >
                    <Bold className="w-3.5 h-3.5 text-slate-700" />
                    <span>In đậm</span>
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200 mx-1.5" />
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('heading')}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-md transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Tiêu đề"
                  >
                    <Heading className="w-3.5 h-3.5 text-slate-700" />
                    <span>Tiêu đề</span>
                  </button>
                </div>

                {/* ContentEditable Div */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  {...{ placeholder: "Nêu rõ yêu cầu dự án, sản phẩm bàn giao mong muốn và tiêu chí đánh giá..." }}
                  className="rich-editor w-full px-4 py-3 bg-white border-0 text-slate-900 focus:outline-none transition-all text-xs sm:text-sm font-sans min-h-[200px] overflow-y-auto"
                  style={{ outline: 'none' }}
                />
              </div>

              <style>{`
                .rich-editor:empty:before {
                  content: attr(placeholder);
                  color: #94a3b8;
                  cursor: text;
                  pointer-events: none;
                }
                .rich-editor h3 {
                  font-size: 1.125rem;
                  font-weight: bold;
                  color: #0f172a;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                }
                .rich-editor strong {
                  font-weight: bold;
                  color: #0f172a;
                }
              `}</style>
            </div>

            {/* Step 1 Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold">
              {onCancel && (
                <button type="button" onClick={onCancel} className="btn-secondary">
                  Hủy
                </button>
              )}
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary inline-flex items-center gap-1.5 py-2.5 px-6"
              >
                Tiếp tục thiết lập Cột mốc <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Milestones Planner */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Dynamic Total Budget Summary card */}
            <div className="p-5 bg-blue-50/70 border border-blue-200/60 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">
                Tổng ngân sách dự án
              </span>
              <p className="text-3xl font-extrabold text-slate-950 tracking-tight tabular-nums">
                {formatVnd(totalBudget)}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
                Tổng ngân sách dự án bằng tổng giá trị giải ngân của các cột mốc bàn giao bên dưới.
                SME không cần điền tổng tiền thủ công. Khi bạn thêm/xóa cột mốc, con số này sẽ cập nhật.
              </p>
            </div>

            {/* Milestones list display */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Kế hoạch Cột mốc giải ngân ({milestones.length})
              </h3>

              {milestones.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Chưa có cột mốc nào. Hãy điền thông tin bên dưới để thêm cột mốc đầu tiên.
                </p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-4 p-4 border border-slate-200/80 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            MỐC {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{m.title}</span>
                          <span className="font-semibold text-brand-primary">
                            ({formatVnd(m.amountVnd)})
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{m.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Hạn chót hoàn thành: {new Date(m.deadline).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors shrink-0"
                        title="Xóa cột mốc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Milestone Card Form */}
            <div className="p-5 border border-dashed border-slate-300 rounded-xl bg-white space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-primary shrink-0" /> Thêm Cột mốc bàn giao mới
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên cột mốc</label>
                  <input
                    type="text"
                    value={newMTitle}
                    onChange={(e) => setNewMTitle(e.target.value)}
                    placeholder="Ví dụ: Cột mốc 1: Hoàn thiện bản mẫu UI/UX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mô tả sản phẩm bàn giao (Deliverables)</label>
                  <textarea
                    rows={2}
                    value={newMDesc}
                    onChange={(e) => setNewMDesc(e.target.value)}
                    placeholder="Mô tả chi tiết sản phẩm sinh viên cần nộp tại cột mốc này (ví dụ: Link Figma 10 màn hình UI hoàn chỉnh...)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn chót hoàn thành
                    </label>
                    <input
                      type="date"
                      value={newMDeadline}
                      onChange={(e) => setNewMDeadline(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Số tiền giải ngân (VND)
                    </label>
                    <input
                      type="number"
                      step={500000}
                      min={0}
                      value={newMAmount}
                      onChange={(e) => setNewMAmount(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-slate-400 font-medium">
                      (= {newMAmount.toLocaleString('vi-VN')} VNĐ)
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMilestone}
                className="btn-secondary text-xs py-2 w-full flex items-center justify-center gap-1.5 font-bold border-brand-primary/30 text-brand-primary hover:bg-blue-50/50"
              >
                <Plus className="w-4 h-4" /> Thêm Cột mốc vào danh sách
              </button>
            </div>

            {/* Step 2 Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Bước 1
              </button>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Ký quỹ giải ngân tự động qua Cột mốc
                </div>

                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white font-bold text-sm shadow-sm"
                >
                  Tiếp tục <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 bg-blue-50/60 border border-blue-200/50 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">
                Xem lại thông tin dự án
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Vui lòng kiểm tra kỹ tất cả các thông tin và kế hoạch cột mốc giải ngân dưới đây trước khi gửi dự án lên hệ thống.
              </p>
            </div>

            {/* General Info Summary */}
            <div className="border border-slate-200/80 rounded-xl p-5 bg-slate-50/20 hover:bg-slate-50/30 transition-all space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  Thông tin cơ bản
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-brand-primary hover:text-blue-800 transition-colors"
                >
                  Thay đổi
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div className="space-y-1 col-span-2">
                  <span className="text-slate-400 font-medium block">Tiêu đề dự án</span>
                  <span className="text-sm font-bold text-slate-900 block">{title}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Danh mục</span>
                  <span className="font-bold text-slate-800 block text-xs">
                    {categories.find((c) => c.id === categoryTagId)?.name || 'Chưa chọn'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Số lượng ứng viên tối đa</span>
                  <span className="font-bold text-slate-800 block text-xs">{maxApplicants} ứng viên</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Tổng ngân sách dự án (Tổng tiền cột mốc)</span>
                  <span className="font-extrabold text-brand-primary text-sm block">
                    {formatVnd(totalBudget)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Thời gian thực hiện (ước tính)</span>
                  <span className="font-bold text-slate-800 block text-xs">{calculatedDurationWeeks} tuần</span>
                </div>
              </div>

              {selectedSkillNames.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-slate-400 text-xs font-medium block">Kỹ năng yêu cầu</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkillNames.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Summary */}
            <div className="border border-slate-200/80 rounded-xl p-5 bg-slate-50/20 hover:bg-slate-50/30 transition-all space-y-3">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mô tả chi tiết dự án
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-brand-primary hover:text-blue-800 transition-colors"
                >
                  Thay đổi
                </button>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-lg max-h-[220px] overflow-y-auto space-y-1 custom-scrollbar shadow-xs">
                {parseMarkdown(description)}
              </div>
            </div>

            {/* Milestones Plan Summary */}
            <div className="border border-slate-200/80 rounded-xl p-5 bg-slate-50/20 hover:bg-slate-50/30 transition-all space-y-3">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Kế hoạch cột mốc giải ngân ({milestones.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-brand-primary hover:text-blue-800 transition-colors"
                >
                  Thay đổi
                </button>
              </div>
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-slate-200 rounded-xl text-xs flex justify-between items-start gap-4 hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          MỐC {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed max-w-xl">{m.description}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Hạn chót: {new Date(m.deadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className="font-extrabold text-brand-primary shrink-0 text-xs sm:text-sm">
                      {formatVnd(m.amountVnd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Bước 2
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 disabled:opacity-50 text-white font-bold text-sm shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      {projectToEdit ? 'Lưu thay đổi' : 'Đăng dự án ngay'} <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
