import React, { useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorMessage } from '../../components/UI/ErrorMessage';

import { LoadingOverlay, TableSkeleton } from '../../components/UI/LoadingStates';
import { useApp } from '../../contexts/AppContext';
import { useApiCall, useApiForm, useOptimisticUpdate } from '../../hooks/useApi';
import { exerciseAPI } from '../../services/api';
import { Exercise } from '../../contexts/AppContext';
import { showSuccess, showError } from '../../components/Notifications/NotificationManager';

interface ExerciseFormData {
  title: string;
  description: string;
  requirements: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxScore: number;
  isPublished?: boolean;
  apiInfo?: string;
}

export function ExerciseManagement() {
  const { dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState<ExerciseFormData>({
    title: '',
    description: '',
    requirements: '',
    difficulty: 'beginner',
    maxScore: 100,
  });
  const [formErrors, setFormErrors] = useState<Partial<ExerciseFormData>>({});

  // Enhanced API calls with error handling and loading states
  const {
    data: exercises,
    loading: exercisesLoading,
    error: exercisesError,
    retry: retryLoadExercises
  } = useApiCall(
    () => exerciseAPI.getExercises(),
    [],
    {
      onSuccess: (exercises) => {
        dispatch({ type: 'SET_EXERCISES', payload: exercises });
        dispatch({ type: 'SET_LAST_UPDATED', payload: { key: 'exercises', date: new Date() } });
      },
      onError: (error) => {
        showError('Load Error', `Failed to load exercises: ${error.message}`);
      }
    }
  );

  // Form submission with enhanced error handling
  const {
    submit: submitExercise,
    isSubmitting,
    error: submitError,
    reset: resetSubmitState
  } = useApiForm(
    async (data: ExerciseFormData) => {
      const exerciseData = { ...data, isPublished: false };
      if (editingExercise) {
        return exerciseAPI.updateExercise(editingExercise.id, exerciseData);
      } else {
        return exerciseAPI.createExercise(exerciseData);
      }
    },
    {
      onSuccess: (result) => {
        if (editingExercise) {
          dispatch({ type: 'UPDATE_EXERCISE', payload: result });
          showSuccess('Success', 'Exercise updated successfully');
        } else {
          dispatch({ type: 'ADD_EXERCISE', payload: result });
          showSuccess('Success', 'Exercise created successfully');
        }
        resetForm();
      },
      onError: (error) => {
        showError('Submit Error', `Failed to save exercise: ${error.message}`);
      },
      resetOnSuccess: true
    }
  );

  // Optimistic updates for publish/unpublish actions
  const {
    update: updateExerciseOptimistically,
    isUpdating: isTogglingPublish
  } = useOptimisticUpdate(
    null,
    async (exercise: Exercise) => {
      if (exercise.isPublished) {
        return exerciseAPI.unpublishExercise(exercise.id);
      } else {
        return exerciseAPI.publishExercise(exercise.id);
      }
    }
  );

  const validateForm = (): boolean => {
    const errors: Partial<ExerciseFormData> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.requirements.trim()) {
      errors.requirements = 'Requirements are required';
    }
    
    if (formData.maxScore <= 0) {
      errors.maxScore = 'Max score must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await submitExercise(formData);
    } catch (error) {
      // Error handling is done in the useApiForm hook
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      title: exercise.title,
      description: exercise.description,
      requirements: exercise.requirements,
      difficulty: exercise.difficulty,
      maxScore: exercise.maxScore,
      apiInfo: exercise.apiInfo || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      await exerciseAPI.deleteExercise(exerciseId);
      dispatch({ type: 'DELETE_EXERCISE', payload: exerciseId });
      showSuccess('Success', 'Exercise deleted successfully');
    } catch (error) {
      showError('Delete Error', `Failed to delete exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePublishToggle = async (exercise: Exercise) => {
    try {
      const updatedExercise = await updateExerciseOptimistically(exercise);
      dispatch({ type: 'UPDATE_EXERCISE', payload: updatedExercise });
      showSuccess('Success', `Exercise ${updatedExercise.isPublished ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      showError('Update Error', `Failed to update exercise status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      difficulty: 'beginner',
      maxScore: 100,
      apiInfo: '',
    });
    setFormErrors({});
    setEditingExercise(null);
    setShowCreateForm(false);
    resetSubmitState();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (exercisesLoading) {
    return (
      <Layout title="Exercise Management">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Exercise Management</h1>
            <Button variant="primary" disabled>
              Create New Exercise
            </Button>
          </div>
          <TableSkeleton rows={5} columns={6} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Exercise Management">
      <div className="space-y-6">
        {exercisesError && (
          <ErrorMessage 
            message={`Failed to load exercises: ${exercisesError.message}`}
            onDismiss={() => retryLoadExercises()}
            action={{
              label: 'Retry',
              onClick: retryLoadExercises
            }}
          />
        )}

        {submitError && (
          <ErrorMessage 
            message={`Failed to save exercise: ${submitError.message}`}
            onDismiss={() => resetSubmitState()}
          />
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Exercise Management</h1>
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
            disabled={isSubmitting}
          >
            Create New Exercise
          </Button>
        </div>

        {showCreateForm && (
          <Card title={editingExercise ? 'Edit Exercise' : 'Create New Exercise'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter exercise title"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter exercise description"
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements *
                </label>
                <textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.requirements ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter detailed requirements and instructions"
                />
                {formErrors.requirements && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.requirements}</p>
                )}
              </div>

              <div>
                <label htmlFor="apiInfo" className="block text-sm font-medium text-gray-700 mb-1">
                  API Submission Information (Optional)
                </label>
                <textarea
                  id="apiInfo"
                  value={formData.apiInfo || ''}
                  onChange={(e) => setFormData({ ...formData, apiInfo: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter API information in HTML format (optional)"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Supports HTML. Leave empty to hide API information section.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Score *
                  </label>
                  <input
                    type="number"
                    id="maxScore"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.maxScore ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="100"
                  />
                  {formErrors.maxScore && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.maxScore}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                >
                  {editingExercise ? 'Update Exercise' : 'Create Exercise'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <LoadingOverlay loading={isTogglingPublish} text="Updating exercise status...">
          <Card title="Exercises">
            {!exercises || exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No exercises found. Create your first exercise to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          exercise.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {exercise.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{exercise.description}</p>
                      <p className="text-sm text-gray-500">Max Score: {exercise.maxScore}</p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(exercise)}
                        disabled={isSubmitting || isTogglingPublish}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={exercise.isPublished ? 'secondary' : 'success'}
                        onClick={() => handlePublishToggle(exercise)}
                        disabled={isSubmitting || isTogglingPublish}
                        loading={isTogglingPublish}
                      >
                        {exercise.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(exercise.id)}
                        disabled={isSubmitting || isTogglingPublish}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </Card>
        </LoadingOverlay>
      </div>
    </Layout>
  );
}