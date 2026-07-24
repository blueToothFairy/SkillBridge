'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PREDEFINED_CATEGORIES, PREDEFINED_SKILLS } from '@/lib/mockData';
import { PredefinedCategory, PredefinedSkill } from '@/types';
import { Check, Plus, Trash2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PostProjectPage() {
  const { addProject } = useApp();
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PredefinedCategory>('Design');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<'Remote' | 'On-site'>('Remote');
  const [budgetVnd, setBudgetVnd] = useState(14400000);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [maxApplicants, setMaxApplicants] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<PredefinedSkill[]>([
    'Figma',
    'Brand Strategy',
    'Content Strategy',
  ]);

  const [milestones, setMilestones] = useState([
    {
      title: 'Brand discovery & mood board',
      description: 'Initial positioning analysis and mood board visual direction.',
      deadline: '28 Nov 2024',
      amountVnd: 3600000,
    },
    {
      title: 'Logo concepts (3 directions)',
      description: 'Vector logo concepts including wordmark and color palette explorations.',
      deadline: '05 Dec 2024',
      amountVnd: 3600000,
    },
  ]);

  const handleToggleSkill = (skill: PredefinedSkill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      if (selectedSkills.length < 10) {
        setSelectedSkills([...selectedSkills, skill]);
      }
    }
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}`,
        description: 'Deliverable details for this milestone checkpoint.',
        deadline: '15 Dec 2024',
        amountVnd: 3600000,
      },
    ]);
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({
      title: title || 'Brand Identity Redesign for Coffee Shop',
      description:
        description ||
        'Describe the project in detail: what you need done, the context, any existing assets, and what success looks like.',
      smeName: 'Sarah Mitchell',
      smeCompany: 'Artisan Coffee Co.',
      smeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      category,
      requiredSkills: selectedSkills,
      budgetVnd,
      durationWeeks,
      location,
      maxApplicants,
      milestones: milestones.map((m, idx) => ({
        id: `ms-new-${idx}`,
        projectId: 'temp',
        title: m.title,
        description: m.description,
        deadline: m.deadline,
        orderIndex: idx + 1,
        status: 'PENDING',
        amountVnd: m.amountVnd,
      })),
    });

    router.push('/sme/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Post a Project</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create a short-term project listing with predefined skill tags for student matching.
          </p>
        </div>
      </div>

      {/* Stepper Header (Photo #1 match) */}
      <div className="card-crisp p-4 bg-white flex items-center justify-between text-xs sm:text-sm font-medium">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Budget & Timeline' },
          { num: 3, label: 'Skills & Deliverables' },
          { num: 4, label: 'Review & Submit' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-blue-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </span>
            <span
              className={`hidden sm:inline ${
                step === s.num ? 'font-bold text-slate-900' : 'text-slate-500'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Wizard Form Body */}
      <div className="card-crisp p-6 bg-white space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Basic Info</h2>
              <p className="text-xs text-slate-500">Step 1 of 4</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Brand Identity Redesign for Coffee Shop"
                className="w-full text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keep it clear and specific. Students search by title.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PredefinedCategory)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
              >
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project in detail: what you need done, the context, any existing assets, and what success looks like."
                className="w-full text-sm p-3 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {description.length}/1000 characters. Aim for 200–500.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Work Location</label>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    checked={location === 'Remote'}
                    onChange={() => setLocation('Remote')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remote</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    checked={location === 'On-site'}
                    onChange={() => setLocation('On-site')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>On-site (Ho Chi Minh City)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Budget & Timeline</h2>
              <p className="text-xs text-slate-500">Step 2 of 4</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Project Budget (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={budgetVnd}
                onChange={(e) => setBudgetVnd(Number(e.target.value))}
                step={500000}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Typical pilot budget range: 3,000,000 – 18,000,000 VND (Simulated Escrow).
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Estimated Duration (Weeks) <span className="text-red-500">*</span>
              </label>
              <select
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value={1}>1 week</option>
                <option value={2}>2 weeks</option>
                <option value={3}>3 weeks</option>
                <option value={4}>4 weeks</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Maximum Accepted Applicants (1–4)
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={maxApplicants}
                onChange={(e) => setMaxApplicants(Number(e.target.value))}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                How many students can work on this project (individual entries, max 4).
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Skills & Deliverables</h2>
              <p className="text-xs text-slate-500">Step 3 of 4</p>
            </div>

            {/* Required Skills Chips */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Required Skill Tags (Predefined list - Select 1 to 10)
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-md border border-slate-200">
                {PREDEFINED_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {skill} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Milestones Creator */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-700">Project Milestones</label>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Milestone
                </button>
              </div>

              <div className="space-y-3">
                {milestones.map((ms, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Milestone #{idx + 1}
                      </span>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={ms.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].title = e.target.value;
                          setMilestones(updated);
                        }}
                        placeholder="Milestone title"
                        className="text-xs p-2 bg-white border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={ms.deadline}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].deadline = e.target.value;
                          setMilestones(updated);
                        }}
                        placeholder="Deadline (e.g. 28 Nov 2024)"
                        className="text-xs p-2 bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <input
                      type="text"
                      value={ms.description}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[idx].description = e.target.value;
                        setMilestones(updated);
                      }}
                      placeholder="Brief deliverable description..."
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Review & Submit</h2>
              <p className="text-xs text-slate-500">Step 4 of 4 — Check your project details</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Title</span>
                <p className="text-sm font-bold text-slate-900">
                  {title || 'Brand Identity Redesign for Coffee Shop'}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-semibold text-slate-900">{category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Budget</span>
                  <span className="font-semibold text-slate-900">
                    {budgetVnd.toLocaleString()} VND
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Duration</span>
                  <span className="font-semibold text-slate-900">{durationWeeks} weeks</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Applicants</span>
                  <span className="font-semibold text-slate-900">{maxApplicants}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Required Skills</span>
                <div className="flex flex-wrap gap-1">
                  {selectedSkills.map((s) => (
                    <span key={s} className="tag-predefined">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Admin Review Protocol</p>
                <p className="text-blue-700 text-[11px]">
                  Upon submitting, your project will be reviewed by platform administrators (Status: DRAFT → OPEN) before being published to university students.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="btn-primary text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              Next Step <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              Submit Project Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
