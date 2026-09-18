import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  User,
  MapPin,
  Award,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Video,
  Lock,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { QualificationItem, ExperienceItem } from '../../types';

export const TeacherApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const queryEmail = searchParams.get('email') || '';
  const queryPass = searchParams.get('pass') || '';

  // Steps: 0 = Gmail OTP Verification, 1 to 7 = Application Wizard
  const [currentStep, setCurrentStep] = useState<number>(queryEmail ? 0 : 0);

  // OTP Verification State
  const [email, setEmail] = useState<string>(queryEmail);
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);

  // Password for account
  const [password, setPassword] = useState<string>(queryPass);
  const [confirmPassword, setConfirmPassword] = useState<string>(queryPass);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [mobile, setMobile] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');

  // Step 2: Address Details
  const [state, setState] = useState<string>('Uttar Pradesh');
  const [district, setDistrict] = useState<string>('Lucknow');
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [pin, setPin] = useState<string>('');

  // Step 3: Qualifications
  const [qualifications, setQualifications] = useState<QualificationItem[]>([
    { degree: 'MA Political Science', university: 'Lucknow University', year: '2020', percentage: '76.5%' },
  ]);

  // Step 4: Experiences
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      institute: 'Lo Samajh Lo Faculty',
      designation: 'Senior Faculty',
      subjects: 'General Studies & Current Affairs',
      years: '4',
      description: 'Mentored over 5000+ aspirants for state and national examinations.',
    },
  ]);

  // Step 5: Teaching Profile
  const availableSubjects = [
    'GS (General Studies)',
    'Current Affairs',
    'Mathematics',
    'Reasoning & Aptitude',
    'General Hindi',
    'General English',
    'History & Culture',
    'Indian Polity & Constitution',
    'Geography & Environment',
    'General Science',
  ];
  const availableExams = [
    'UPSSSC PET 2026',
    'UP TET 2026',
    'UPSI 2026',
    'SSC CGL / CHSL',
    'Railway NTPC / Group D',
    'UP Police Constable',
    'RO / ARO 2026',
    'BSSC / Bihar SSC',
  ];
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['GS (General Studies)', 'Current Affairs']);
  const [selectedExams, setSelectedExams] = useState<string[]>(['UPSSSC PET 2026', 'UP TET 2026']);
  const [teachingMedium, setTeachingMedium] = useState<string>('BILINGUAL');
  const [teachingMode, setTeachingMode] = useState<string>('BOTH');
  const [specialization, setSpecialization] = useState<string>('Polity & Current Affairs');
  const [bio, setBio] = useState<string>('');
  const [demoVideoUrl, setDemoVideoUrl] = useState<string>('');

  // Step 6: Documents
  const [cvUrl, setCvUrl] = useState<string>('');
  const [qualificationCertUrl, setQualificationCertUrl] = useState<string>('');
  const [experienceCertUrl, setExperienceCertUrl] = useState<string>('');
  const [idProofType, setIdProofType] = useState<string>('AADHAAR');
  const [idProofUrl, setIdProofUrl] = useState<string>('');
  const [otherDocs, setOtherDocs] = useState<Array<{ name: string; url: string }>>([]);

  // Uploading state
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Step 7: Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request OTP
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      toastError('Please provide a valid email address.');
      return;
    }
    try {
      setOtpLoading(true);
      const res = await api.teacher.sendOtp(email);
      if (res.success) {
        setOtpSent(true);
        setCooldown(res.cooldownSeconds || 60);
        success(res.message || '6-Digit verification code sent to your email.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toastError('Please enter the 6-digit OTP code.');
      return;
    }
    try {
      setOtpLoading(true);
      const res = await api.teacher.verifyOtp(email, otp);
      if (res.success) {
        setOtpVerified(true);
        success('Email verified successfully! Beginning Teacher Application.');
        setCurrentStep(1); // Proceed to Step 1: Personal Details
      }
    } catch (err: any) {
      toastError(err.message || 'Invalid or expired OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Document Upload Helper to Google Drive
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, subCategory: string, stateSetter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(subCategory);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);
      formData.append('subCategory', subCategory);

      const res = await api.teacher.uploadDocument(formData);
      if (res.success && res.fileUrl) {
        stateSetter(res.fileUrl);
        success(`${subCategory} uploaded successfully to secure storage.`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingField(null);
    }
  };

  // Step 3 Qualification Handlers
  const addQualification = () => {
    setQualifications([...qualifications, { degree: '', university: '', year: '', percentage: '' }]);
  };
  const removeQualification = (idx: number) => {
    setQualifications(qualifications.filter((_, i) => i !== idx));
  };
  const updateQualification = (idx: number, field: keyof QualificationItem, value: string) => {
    const updated = [...qualifications];
    updated[idx] = { ...updated[idx], [field]: value };
    setQualifications(updated);
  };

  // Step 4 Experience Handlers
  const addExperience = () => {
    setExperiences([...experiences, { institute: '', designation: '', subjects: '', years: '', description: '' }]);
  };
  const removeExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };
  const updateExperience = (idx: number, field: keyof ExperienceItem, value: string) => {
    const updated = [...experiences];
    updated[idx] = { ...updated[idx], [field]: value };
    setExperiences(updated);
  };

  // Step 5 Subject & Exam Toggle
  const toggleSubject = (s: string) => {
    setSelectedSubjects(
      selectedSubjects.includes(s) ? selectedSubjects.filter((x) => x !== s) : [...selectedSubjects, s]
    );
  };
  const toggleExam = (ex: string) => {
    setSelectedExams(
      selectedExams.includes(ex) ? selectedExams.filter((x) => x !== ex) : [...selectedExams, ex]
    );
  };

  // Final Submission
  const handleSubmitApplication = async () => {
    if (!declarationAccepted) {
      toastError('Please accept the declaration terms before submitting.');
      return;
    }
    if (!password || password !== confirmPassword) {
      toastError('Please ensure your password is confirmed.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        email,
        password,
        confirmPassword,
        fullName,
        profilePhoto,
        dob,
        gender,
        mobile,
        whatsapp,
        state,
        district,
        city,
        address,
        pin,
        qualifications,
        experiences,
        subjects: selectedSubjects,
        exams: selectedExams,
        teachingMedium,
        teachingMode,
        specialization,
        bio,
        demoVideoUrl,
        cvUrl,
        idProofUrl,
        idProofType,
        qualificationCertUrl,
        experienceCertUrl,
        otherDocs,
        declarationAccepted,
      };

      const res = await api.teacher.apply(payload);
      if (res.success) {
        success('Teacher application submitted successfully! Profile is now UNDER REVIEW.');
        navigate(`/teacher/status?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Submission failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Email Verification',
    'Personal Details',
    'Address Details',
    'Qualifications',
    'Experience',
    'Teaching Profile',
    'Documents',
    'Review & Submit',
  ];

  return (
    <div className="min-h-screen bg-[#F0F4FF] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#0B2A63] via-[#1D4ED8] to-[#0B2A63] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/15">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>FACULTY ENROLLMENT PROGRAM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Teacher & Faculty Application
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Join India's trusted learning platform. Teach courses, conduct interactive live classes, and mentor thousands of ambitious students.
            </p>
          </div>
        </div>

        {/* Multi-Step Wizard Progress Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
            {stepTitles.map((title, idx) => {
              const isDone = currentStep > idx || (idx === 0 && otpVerified);
              const isCurrent = currentStep === idx;
              return (
                <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#0B2A63] text-white ring-4 ring-[#0B2A63]/15'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap hidden md:inline font-bold ${
                      isCurrent ? 'text-[#0B2A63]' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {title}
                  </span>
                  {idx < stepTitles.length - 1 && <div className="w-4 sm:w-8 h-0.5 bg-slate-200" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 0: GMAIL OTP VERIFICATION */}
        {currentStep === 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 animate-scale-in">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0B2A63] mx-auto flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verify Your Email Address</h2>
              <p className="text-xs text-slate-500">
                To guarantee security and authentic faculty registration, please verify your Gmail address with a 6-digit OTP.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Teacher Email Address *</label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@gmail.com"
                    disabled={otpVerified || otpSent}
                    className="w-full bg-transparent text-xs text-slate-800 outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !email}
                  className="w-full py-3 rounded-xl bg-[#0B2A63] hover:bg-[#071c42] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>Send 6-Digit OTP</span>
                </button>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-950 space-y-1">
                    <p className="font-bold">Enter Verification Code</p>
                    <p className="text-[11px] text-blue-700">
                      We sent a 6-digit OTP to <strong>{email}</strong> (valid for 10 minutes).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[10px] text-xl font-mono font-black py-2.5 rounded-xl border border-slate-300 focus:border-[#0B2A63] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={cooldown > 0 || otpLoading}
                      className="text-[#0B2A63] font-bold hover:underline disabled:text-slate-400"
                    >
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      Change Email
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length !== 6}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Verify Email & Start Application</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 1 — Personal Details</h2>
              <p className="text-xs text-slate-500">Provide basic demographic and contact information</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Date of Birth *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none bg-white"
                >
                  <option value="Male">Male (पुरुष)</option>
                  <option value="Female">Female (महिला)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="9876543210 (Optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Verified Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!fullName || !mobile}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#0B2A63] text-white text-xs font-bold hover:bg-[#071c42] disabled:opacity-50 flex items-center gap-2"
              >
                <span>Continue to Address Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ADDRESS DETAILS */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 2 — Address Details</h2>
              <p className="text-xs text-slate-500">Residential and contact location details</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">State *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">District *</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Lucknow / Prayagraj"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">City / Town *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lucknow"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="226001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Full Residential Address *</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House No., Street, Landmark..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!state || !district || !address}
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-[#0B2A63] text-white text-xs font-bold hover:bg-[#071c42] disabled:opacity-50 flex items-center gap-2"
              >
                <span>Continue to Qualifications</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: QUALIFICATIONS */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 3 — Qualification Details</h2>
                <p className="text-xs text-slate-500">Add your degrees, certifications, and academic background</p>
              </div>
              <button
                type="button"
                onClick={addQualification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2A63]/10 text-[#0B2A63] text-xs font-bold hover:bg-[#0B2A63]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Qualification</span>
              </button>
            </div>

            <div className="space-y-4">
              {qualifications.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Qualification #{idx + 1}</span>
                    {qualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQualification(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Degree / Examination *</label>
                      <input
                        type="text"
                        value={q.degree}
                        onChange={(e) => updateQualification(idx, 'degree', e.target.value)}
                        placeholder="e.g. MA Political Science / B.Ed"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">University / Board *</label>
                      <input
                        type="text"
                        value={q.university}
                        onChange={(e) => updateQualification(idx, 'university', e.target.value)}
                        placeholder="e.g. University of Delhi"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Passing Year *</label>
                      <input
                        type="text"
                        value={q.year}
                        onChange={(e) => updateQualification(idx, 'year', e.target.value)}
                        placeholder="2022"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Percentage / CGPA *</label>
                      <input
                        type="text"
                        value={q.percentage}
                        onChange={(e) => updateQualification(idx, 'percentage', e.target.value)}
                        placeholder="78.5% or 8.2 CGPA"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-[#0B2A63] text-white text-xs font-bold hover:bg-[#071c42] flex items-center gap-2"
              >
                <span>Continue to Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EXPERIENCE */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 4 — Teaching Experience</h2>
                <p className="text-xs text-slate-500">Your prior coaching, institute, or online teaching track record</p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2A63]/10 text-[#0B2A63] text-xs font-bold hover:bg-[#0B2A63]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            </div>

            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Experience #{idx + 1}</span>
                    {experiences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Teaching Institute / College *</label>
                      <input
                        type="text"
                        value={exp.institute}
                        onChange={(e) => updateExperience(idx, 'institute', e.target.value)}
                        placeholder="e.g. Drishti / Sankalp Academy"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Designation *</label>
                      <input
                        type="text"
                        value={exp.designation}
                        onChange={(e) => updateExperience(idx, 'designation', e.target.value)}
                        placeholder="e.g. Senior Faculty / Educator"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Subjects Taught *</label>
                      <input
                        type="text"
                        value={exp.subjects}
                        onChange={(e) => updateExperience(idx, 'subjects', e.target.value)}
                        placeholder="e.g. GS, History, Current Affairs"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Years of Experience *</label>
                      <input
                        type="number"
                        min={0}
                        value={exp.years}
                        onChange={(e) => updateExperience(idx, 'years', e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600">Description / Highlights</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                        placeholder="Key responsibilities and achievements..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-6 py-2.5 rounded-xl bg-[#0B2A63] text-white text-xs font-bold hover:bg-[#071c42] flex items-center gap-2"
              >
                <span>Continue to Teaching Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: TEACHING PROFILE */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 5 — Teaching Profile & Preferences</h2>
              <p className="text-xs text-slate-500">Specify your subject specialties, exams, and teaching medium</p>
            </div>

            {/* Subjects Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Subjects you can teach (Select all that apply) *</label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((sub) => {
                  const active = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#0B2A63] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Exams */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Target Exams *</label>
              <div className="flex flex-wrap gap-2">
                {availableExams.map((ex) => {
                  const active = selectedExams.includes(ex);
                  return (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => toggleExam(ex)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {ex}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Teaching Medium *</label>
                <select
                  value={teachingMedium}
                  onChange={(e) => setTeachingMedium(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                >
                  <option value="BILINGUAL">Bilingual (Hindi + English)</option>
                  <option value="HINDI">Hindi Medium (हिन्दी)</option>
                  <option value="ENGLISH">English Medium</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Teaching Mode *</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                >
                  <option value="BOTH">Live Classes & Recorded Lectures</option>
                  <option value="ONLINE_LIVE">Online Live Classes Only</option>
                  <option value="RECORDED">Recorded Lectures Only</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Specialization / Core Expertise *</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Indian Constitution, Arithmetic, UP Special GK"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Professional Bio / Introduction *</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students and administrators about your teaching philosophy and accomplishments..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B2A63] text-xs outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Demo Lecture Video Link (YouTube / Drive) *</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Video className="w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={demoVideoUrl}
                    onChange={(e) => setDemoVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Google Drive video link"
                    className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-6 py-2.5 rounded-xl bg-[#0B2A63] text-white text-xs font-bold hover:bg-[#071c42] flex items-center gap-2"
              >
                <span>Continue to Document Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: DOCUMENTS (GOOGLE DRIVE STORAGE) */}
        {currentStep === 6 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 6 — Document Verification (Google Drive)</h2>
              <p className="text-xs text-slate-500">
                Uploaded securely to the Lo Samajh Lo Google Drive repository. These documents are strictly private and accessible only to administrators.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Profile Photo */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0B2A63] transition-colors space-y-2">
                <span className="text-xs font-bold text-slate-800 block">1. Faculty Profile Photo *</span>
                <p className="text-[11px] text-slate-500">Professional portrait photo (JPG / PNG)</p>
                {profilePhoto ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="truncate">Photo Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                    {uploadingField === 'Profile' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Profile', setProfilePhoto)} />
                  </label>
                )}
              </div>

              {/* CV / Resume */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0B2A63] transition-colors space-y-2">
                <span className="text-xs font-bold text-slate-800 block">2. CV / Resume (PDF) *</span>
                <p className="text-[11px] text-slate-500">Comprehensive educational & teaching resume</p>
                {cvUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="truncate">Resume Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                    {uploadingField === 'CV' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload CV (PDF)</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'CV', setCvUrl)} />
                  </label>
                )}
              </div>

              {/* Qualification Certificate */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0B2A63] transition-colors space-y-2">
                <span className="text-xs font-bold text-slate-800 block">3. Highest Qualification Certificate *</span>
                <p className="text-[11px] text-slate-500">Degree certificate or mark sheet</p>
                {qualificationCertUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="truncate">Degree Certificate Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                    {uploadingField === 'Qualification' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload Certificate</span>
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Qualification', setQualificationCertUrl)} />
                  </label>
                )}
              </div>

              {/* Experience Certificate */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0B2A63] transition-colors space-y-2">
                <span className="text-xs font-bold text-slate-800 block">4. Experience Certificate (Optional)</span>
                <p className="text-[11px] text-slate-500">Proof of prior coaching or teaching</p>
                {experienceCertUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="truncate">Experience Certificate Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                    {uploadingField === 'Experience' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload Proof</span>
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Experience', setExperienceCertUrl)} />
                  </label>
                )}
              </div>

              {/* Identity Proof */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0B2A63] transition-colors space-y-2 sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">5. Government Identity Proof *</span>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                  >
                    <option value="AADHAAR">Aadhaar Card (आधार)</option>
                    <option value="PAN">PAN Card</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">Official government ID document. Kept completely confidential.</p>
                {idProofUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="truncate">Identity Document ({idProofType}) Uploaded</span>
                  </div>
                ) : (
                  <label className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                    {uploadingField === 'Identity' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload {idProofType} Proof</span>
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Identity', setIdProofUrl)} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(7)}
                className="px-6 py-2.5 rounded-xl bg-[#0B2A63] text-white text-xs font-bold hover:bg-[#071c42] flex items-center gap-2"
              >
                <span>Continue to Declaration & Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: DECLARATION & SUBMIT */}
        {currentStep === 7 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 7 — Declaration & Final Submission</h2>
              <p className="text-xs text-slate-500">Review your application summary and confirm account details</p>
            </div>

            {/* Application Summary Cards */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase">Applicant</span>
                <p className="font-bold text-slate-900 text-sm">{fullName}</p>
                <p className="text-slate-600">{email}</p>
                <p className="text-slate-600">Mobile: {mobile}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase">Teaching Profile</span>
                <p className="font-bold text-slate-900">{specialization}</p>
                <p className="text-slate-600">{selectedSubjects.slice(0, 3).join(', ')}</p>
                <p className="text-slate-600">Mode: {teachingMode} • {teachingMedium}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-500 text-[10px] uppercase">Uploaded Documents</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${profilePhoto ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    Profile Photo {profilePhoto ? '✓' : 'Pending'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${cvUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    CV / Resume {cvUrl ? '✓' : 'Pending'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${qualificationCertUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    Degree Certificate {qualificationCertUrl ? '✓' : 'Pending'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${idProofUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    ID Proof ({idProofType}) {idProofUrl ? '✓' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Set Password if not set */}
            {(!password || password.length < 6) && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <span className="text-xs font-bold text-blue-900 block">Set Teacher Account Password *</span>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Legal Declaration */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#0B2A63] rounded border-slate-300 focus:ring-[#0B2A63]"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong>Declaration & Terms of Agreement:</strong> I hereby declare that all information, certificates, and details provided in this application are authentic and true to the best of my knowledge. I understand that account approval and course assignment are subject to administrative review.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || !declarationAccepted}
                onClick={handleSubmitApplication}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Submit Application for Review</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherApplyPage;
