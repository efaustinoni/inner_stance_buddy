// Created: 2026-02-13
// Last updated: 2026-04-07 (salted security answer hashing on update)

import { useState } from 'react';
import { X, ShieldQuestion, KeyRound, Loader2, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { hashSecurityAnswer, generateSalt } from '../lib/crypto';
import { supabase } from '../lib/supabase';

interface SecurityQuestionModalProps {
  isOpen: boolean;
  currentQuestion: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was your childhood nickname?',
  'What is the name of your favorite childhood friend?',
  'What was the make of your first car?',
  "What is your mother's maiden name?",
  'What was the name of your elementary school?',
  'What is the middle name of your oldest sibling?',
  'In what city did your parents meet?',
  'What was the first concert you attended?',
];

export default function SecurityQuestionModal({
  isOpen,
  currentQuestion,
  onClose,
  onSuccess,
}: SecurityQuestionModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [confirmAnswer, setConfirmAnswer] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewAnswer, setShowNewAnswer] = useState(false);
  const [showConfirmAnswer, setShowConfirmAnswer] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }

    if (!newQuestion) {
      setError('Please select a security question');
      return;
    }

    if (!newAnswer.trim()) {
      setError('Please enter a security answer');
      return;
    }

    if (newAnswer !== confirmAnswer) {
      setError('Security answers do not match');
      return;
    }

    if (newAnswer.trim().length < 2) {
      setError('Security answer must be at least 2 characters');
      return;
    }

    setIsUpdating(true);

    // Store values before clearing form (to prevent password manager prompt)
    const passwordToVerify = currentPassword;
    const questionToSave = newQuestion;
    const answerToSave = newAnswer;

    // Clear form immediately to prevent password manager from capturing it
    setCurrentPassword('');
    setNewAnswer('');
    setConfirmAnswer('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('Not authenticated');
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordToVerify,
      });

      if (signInError) {
        setError('Current password is incorrect');
        setIsUpdating(false);
        return;
      }

      // Generate fresh salt and hash new answer
      const newSalt = generateSalt();
      const newAnswerHash = await hashSecurityAnswer(answerToSave, newSalt);
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          security_question: questionToSave,
          security_answer_hash: newAnswerHash,
          security_answer_salt: newSalt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Reset remaining form fields and close
      setNewQuestion('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating security question:', err);
      setError(err instanceof Error ? err.message : 'Failed to update security question');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewQuestion('');
    setNewAnswer('');
    setConfirmAnswer('');
    setError(null);
    setShowPassword(false);
    setShowNewAnswer(false);
    setShowConfirmAnswer(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldQuestion className="w-6 h-6" />
            Manage Security Question
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-blue-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Password Verification Required</p>
              <p>
                To change your security question, verify your password. Your security question is
                used for password recovery when you're locked out of your account.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            data-form-type="other"
            className="space-y-5"
          >
            {/* Hidden field to prevent password managers from associating this with login */}
            <input
              type="text"
              name="fakeusername"
              autoComplete="username"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="verification-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your password to verify"
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">Required to confirm your identity</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Current Security Question
                </h3>
                <p className="text-sm text-blue-800">{currentQuestion || 'Not set'}</p>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-4">New Security Question</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Question
                  </label>
                  <div className="relative">
                    <ShieldQuestion className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Select a security question</option>
                      {SECURITY_QUESTIONS.map((question) => (
                        <option key={question} value={question}>
                          {question}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewAnswer ? 'text' : 'password'}
                      name="security-answer"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Enter your answer"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAnswer(!showNewAnswer)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showNewAnswer ? 'Hide answer' : 'Show answer'}
                    >
                      {showNewAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Answers are case-insensitive</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Answer
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmAnswer ? 'text' : 'password'}
                      name="security-answer-confirm"
                      value={confirmAnswer}
                      onChange={(e) => setConfirmAnswer(e.target.value)}
                      placeholder="Confirm your answer"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-5 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmAnswer(!showConfirmAnswer)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirmAnswer ? 'Hide answer' : 'Show answer'}
                    >
                      {showConfirmAnswer ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Security Question'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
