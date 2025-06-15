import React from 'react';
import './TestReport.css';

interface TestReportProps {
  results: {
    word: string;
    definition: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  testDirection: 'definition-to-word' | 'word-to-definition';
  onClose: () => void;
  category: string;
}

const TestReport: React.FC<TestReportProps> = ({ results, testDirection, onClose, category }) => {
  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalAnswers = results.length;
  const percentage = Math.round((correctAnswers / totalAnswers) * 100);

  return (
    <div className="test-report-overlay">
      <div className="test-report-modal">
        <div className="test-report-header">
          <h2>Test Results Summary</h2>
          <span className="test-report-category">{category}</span>
        </div>

        <div className="test-report-stats">
          <div className="stat-item">
            <h3>Score</h3>
            <p className={`score ${percentage >= 80 ? 'high' : percentage >= 60 ? 'medium' : 'low'}`}>
              {percentage}%
            </p>
          </div>
          <div className="stat-item">
            <h3>Correct Answers</h3>
            <p>{correctAnswers} of {totalAnswers}</p>
          </div>
          <div className="stat-item">
            <h3>Test Direction</h3>
            <p>{testDirection === 'definition-to-word' ? 'Definition → Word' : 'Word → Definition'}</p>
          </div>
        </div>

        <div className="test-report-details">
          <h3>Detailed Results</h3>
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="result-number">#{index + 1}</span>
                  <span className="result-status">{result.isCorrect ? '✅ Correct' : '❌ Incorrect'}</span>
                </div>
                <div className="result-content">
                  <p>
                    <strong>{testDirection === 'definition-to-word' ? 'Word:' : 'Definition:'}</strong>
                    {testDirection === 'definition-to-word' ? result.word : result.definition}
                  </p>
                  <p>
                    <strong>Your Answer:</strong>
                    {result.userAnswer}
                  </p>
                  {!result.isCorrect && (
                    <p className="correct-answer">
                      <strong>Correct Answer:</strong>
                      {testDirection === 'definition-to-word' ? result.word : result.definition}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="test-report-actions">
          <button onClick={onClose} className="close-report-button">
            Start New Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestReport; 