import { useState, useEffect } from 'react';
import type { Question } from '../types/Question';
import { questionAPI } from '../services/api';
import QuestionList from './QuestionList.tsx';
import ReviewQueue from './ReviewQueue.tsx';
import AddQuestion from './AddQuestion.tsx';
import './Dashboard.css';

export default function Dashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'review' | 'add'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('Loading data from backend API...');
      
      console.log('Fetching questions...');
      const loadedQuestions = await questionAPI.getAllQuestions();
      console.log(`Loaded ${loadedQuestions.length} questions from backend`);
      setQuestions(loadedQuestions);
      
      console.log('Fetching stats...');
      const statsData = await questionAPI.getStats();
      console.log('Stats loaded:', statsData);
      setStats(statsData);
      
      console.log('Data loading completed successfully');
    } catch (error) {
      console.error('Error loading data from backend:', error);
      alert('Failed to load data from backend. Please check that the backend server is running on http://localhost:3001');
      // Set default values to prevent infinite loading
      setStats({
        totalQuestions: 0,
        completed: 0,
        inReview: 0,
        dueToday: 0,
        overdue: 0,
        completedThisWeek: 0,
        reviewedThisWeek: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuestions = async (updatedQuestions: Question[]) => {
    setQuestions(updatedQuestions);
    // Refresh stats after questions update
    try {
      const newStats = await questionAPI.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const addQuestion = async (newQuestion: Omit<Question, 'id'>) => {
    try {
      const createdQuestion = await questionAPI.createQuestion({
        name: newQuestion.name,
        category: newQuestion.category,
        leetcodeUrl: newQuestion.leetcodeUrl,
        leetcodeDifficulty: newQuestion.leetcodeDifficulty,
        notes: newQuestion.notes,
      });
      setQuestions(prev => [...prev, createdQuestion]);
      // Refresh stats after adding question
      const newStats = await questionAPI.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question. Please try again.');
    }
  };

  const downloadCSV = async () => {
    try {
      // Simple JSON export for now - could be enhanced to CSV format later
      const dataStr = JSON.stringify(questions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leetcode-tracker-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download data. Please try again.');
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      console.log("Refreshing data from CSV...");

      // Tell backend to reload from CSV file
      await questionAPI.refreshData();

      // Reload all data in frontend
      await loadInitialData();

      console.log("Data refreshed successfully");
      alert("Data refreshed from CSV file!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          const uploadedQuestions = JSON.parse(content) as Question[];
          // For now, we'll just replace the local state
          // In a full implementation, you might want to sync this with the backend
          setQuestions(uploadedQuestions);
          console.log(`Uploaded ${uploadedQuestions.length} questions from JSON file`);
          alert(`Successfully uploaded ${uploadedQuestions.length} questions`);
        } catch (error) {
          console.error('Error parsing uploaded file:', error);
          alert('Error parsing file. Please check the format (expected JSON).');
        }
      };
      reader.readAsText(file);
    }
    // Reset the input value so the same file can be uploaded again
    event.target.value = '';
  };

  if (loading) {
    return <div className="loading">Loading questions...</div>;
  }

  if (!stats) {
    return <div className="loading">Loading stats...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>LeetCode Practice Tracker</h1>
        <div className="current-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </header>

      <div className="recent-activity">
        <div className="activity-card">
          <span className="activity-number">{stats.completedThisWeek}</span>
          <span className="activity-label">New completions (7 days)</span>
        </div>
        <div className="activity-card">
          <span className="activity-number">{stats.reviewedThisWeek}</span>
          <span className="activity-label">Reviews completed (7 days)</span>
        </div>
        <div className="activity-card">
          <span className="activity-number">{stats.inReview}</span>
          <span className="activity-label">Questions in review queue</span>
        </div>
        <div className="activity-card">
          <span className="activity-number">{stats.overdue}</span>
          <span className="activity-label">Overdue reviews</span>
        </div>
        <div className="activity-card">
          <span className="activity-number">
            {stats.completed}/{stats.totalQuestions}
          </span>
          <span className="activity-label">Total progress</span>
        </div>
      </div>

      <div className="csv-controls">
        <button onClick={downloadCSV} className="csv-button download">
          📥 Download Data
        </button>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: "none" }}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="csv-button upload">
          📤 Upload Data
        </label>
        <button
          onClick={refreshData}
          className="csv-button refresh"
          disabled={loading}
        >
          🔄 Refresh from CSV
        </button>
      </div>

      <nav className="dashboard-nav">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All Questions ({stats.totalQuestions})
        </button>
        <button
          className={activeTab === "review" ? "active" : ""}
          onClick={() => setActiveTab("review")}
        >
          Review Queue ({stats.inReview})
        </button>
        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => setActiveTab("add")}
        >
          Add Question
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "all" && (
          <QuestionList
            questions={questions}
            onUpdateQuestions={updateQuestions}
          />
        )}
        {activeTab === "review" && (
          <ReviewQueue
            questions={questions}
            onUpdateQuestions={updateQuestions}
          />
        )}
        {activeTab === "add" && (
          <AddQuestion
            questions={questions}
            onAddQuestion={addQuestion}
            onBack={() => setActiveTab("all")}
          />
        )}
      </main>
    </div>
  );
}
