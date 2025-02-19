import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import "./App.css";

const App = () => {
  const [flashcard, setFlashcard] = useState({});
  const [userGuess, setUserGuess] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [failedGuesses, setFailedGuesses] = useState(0);
  const [isCorrectAnimation, setIsCorrectAnimation] = useState(false);
  const [useDefaultList, setUseDefaultList] = useState(true); // Toggle state
  const [customWords, setCustomWords] = useState([]);

  const fetchFlashcard = async () => {
    try {
      const response = await fetch(
        "https://flashcard-game-backend.onrender.com/api/flashcard",
      );
      if (!response.ok) throw new Error("Failed to fetch flashcard");
      const data = await response.json();
      setFlashcard(data);
    } catch (error) {
      console.error("Error fetching flashcard:", error.message || error);
    }
  };

  useEffect(() => {
    fetchFlashcard();
  }, []);

  const handleGuess = () => {
    if (userGuess.trim().toLowerCase() === flashcard.word.toLowerCase()) {
      setFeedback("Correct!");
      setIsCorrectAnimation(true);
      setIsFlipped(true);
      setCorrectGuesses(correctGuesses + 1);
    } else {
      setFeedback("Try again!");
      setFailedGuesses(failedGuesses + 1);
    }
  };

  const nextCard = () => {
    fetchFlashcard();
    setUserGuess("");
    setIsFlipped(false);
    setFeedback("");
    setIsCorrectAnimation(false);
  };

  const resetGame = async () => {
    setCorrectGuesses(0);
    setFailedGuesses(0);
    setUserGuess("");
    setIsFlipped(false);
    setFeedback("");
    setIsCorrectAnimation(false);
    setCustomWords([]); // Clear uploaded words

    // Clear the file input
    const fileInput = document.querySelector("input[type='file']");
    if (fileInput) {
      fileInput.value = "";
    }

    try {
      await fetch(
        "https://flashcard-game-backend.onrender.com/api/reset-game",
        {
          method: "POST",
        },
      );
      fetchFlashcard(); // Fetch a new flashcard after resetting
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  };

  const toggleWordList = () => {
    setUseDefaultList(!useDefaultList);
  };

  const sendWordsToBackend = async (words) => {
    try {
      const response = await fetch(
        "https://flashcard-game-backend.onrender.com/api/upload-words", // Replace with your actual backend endpoint
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ words }), // Sending words as an array in JSON format
        },
      );

      if (!response.ok) throw new Error("Failed to upload words");

      const result = await response.json();
      console.log("Server response:", result);
      nextCard();
    } catch (error) {
      console.error("Error sending words to backend:", error.message || error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          const words = result.data.flat().filter((word) => word.trim() !== "");
          setCustomWords(words);
          console.log("Parsed words:", words);

          // Send words to backend
          sendWordsToBackend(words);
        },
      });
    }
  };

  if (!flashcard.word) {
    return (
      <div>
        <h1>Flashcard Game</h1>
        <p>Loading flashcard...</p>
      </div>
    );
  }

  let scenarioWithWord = flashcard.scenario;

  if (isFlipped) {
    scenarioWithWord = scenarioWithWord.replace(/_+/g, flashcard.word.slice(1));
  } else {
    scenarioWithWord = scenarioWithWord.replace("____", "______");
  }

  return (
    <div className="app-container">
      <h1 className="title">Guess the Word!</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="file-upload"
      />

      <div className="counters">
        <p>Correct Guesses: {correctGuesses}</p>
        <p>Failed Guesses: {failedGuesses}</p>
      </div>

      <div className="flashcard">
        {!isFlipped ? (
          <div>
            <p className="flashcard-content">{scenarioWithWord}</p>
            <p className="flashcard-content">{flashcard.definition}</p>
          </div>
        ) : (
          <div>
            <p
              className={`flashcard-content ${isCorrectAnimation ? "correct-animation" : ""}`}
            >
              {scenarioWithWord}
            </p>
            <p className="flashcard-content">
              Etymology: {flashcard.etymology}
            </p>
            <p className="flashcard-content">
              <b>Correct word: {flashcard.word}</b>
            </p>
          </div>
        )}
      </div>

      {!isFlipped && (
        <div className="form">
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Your guess"
            className="input-field"
          />
          <button className="submit-button" onClick={handleGuess}>
            Submit Guess
          </button>
          <p>{feedback}</p>
        </div>
      )}

      {isFlipped && (
        <button className="submit-button" onClick={nextCard}>
          Next Card
        </button>
      )}

      <button className="refresh-button" onClick={nextCard}>
        Refresh Word
      </button>
      <button className="reset-button" onClick={resetGame}>
        Reset Game
      </button>
    </div>
  );
};

export default App;
