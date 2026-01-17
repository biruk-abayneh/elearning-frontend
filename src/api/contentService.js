import { supabase } from '../supabaseClient'; // Make sure this path is correct

const API_URL = "https://elearning-backend-w6vz.onrender.com";

/**
 * Helper to get the latest JWT token and build headers
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// 1. Get Subjects
export const getSubjects = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subjects`, { headers });
    if (!response.ok) throw new Error('Failed to fetch subjects');
    return await response.json();
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

// 2. Get Chapters
export const getChapters = async (subjectId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/chapters?subjectId=${subjectId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch chapters');
    return await response.json();
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
};

// 3. Get Questions
export const getQuestions = async (chapterId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/questions?chapterId=${chapterId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch questions');
    return await response.json();
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};

// 4. Submit Answer
export const submitAttempt = async (attemptData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/attempts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(attemptData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server Response Error:", errorText);
      throw new Error('Failed to submit attempt');
    }
    return await response.json();
  } catch (error) {
    console.error("Network Error:", error);
    throw error;
  }
};

// 5. Create Question (Admin)
export const createQuestion = async (questionData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(questionData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create question');
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

// 6. Get User Progress
export const getUserProgress = async (userId) => {
  try {
    const headers = await getAuthHeaders();
    // Note: Since the token already identifies the user, your backend 
    // might not even need the userId in the query anymore!
    const response = await fetch(`${API_URL}/progress?userId=${userId}`, { headers });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server Error Detail:", errorData);
      throw new Error('Failed to fetch progress');
    }
    return await response.json();
  } catch (error) {
    console.error("Network/Fetch Error:", error);
    throw error;
  }
};

export const createSubject = async (subjectData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/subjects`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(subjectData),
    });

    // If the server returns 403 or 401, it won't throw an error, it just won't be 'ok'
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Admin authorization failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Logic Error:", error);
    throw error; // This triggers the 'Network Error' catch in your screen
  }
};

export const createChapter = async (chapterData) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/chapters`, {
    method: 'POST',
    headers,
    body: JSON.stringify(chapterData),
  });

  if (!response.ok) {
    // If server returns 400, 404, or 500, this will throw an error
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save');
  }

  return await response.json();
};

export const uploadBulkQuestions = async (chapterId, questionsObj) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/questions/bulk-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ chapter_id: chapterId, questions: questionsObj }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Bulk upload failed');
  }
  return await response.json();
};