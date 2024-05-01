"use client";

import { useState } from 'react';
import type { NextPage } from "next";

const words = ['apple', 'banana', 'orange', 'grape', 'pineapple'];

const HangmanGame: NextPage = () => {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [remainingAttempts, setRemainingAttempts] = useState(6);

  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  };

  const handleNewGame = () => {
    const newWord = getRandomWord();
    setWord(newWord);
    setGuessedLetters(new Set());
    setRemainingAttempts(6);
  };

  const handleGuess = (letter) => {
    if (!guessedLetters.has(letter)) {
      const newGuessedLetters = new Set(guessedLetters);
      newGuessedLetters.add(letter);
      setGuessedLetters(newGuessedLetters);

      if (!word.includes(letter)) {
        setRemainingAttempts(remainingAttempts - 1);
      }
    }
  };

  const getDisplayWord = () => {
    return word
      .split('')
      .map((letter) => (guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
  };

  const isGameWon = () => {
    return word.split('').every((letter) => guessedLetters.has(letter));
  };

  const isGameOver = () => {
    return remainingAttempts === 0 || isGameWon();
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-4xl font-bold mb-4">Hangman Game</h1>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleNewGame}>
        New Game
      </button>
      <div className="mt-8">
        {isGameOver() && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">{isGameWon() ? 'You Win!' : 'Game Over!'}</h2>
            <p>The word was: {word}</p>
          </div>
        )}
        {!isGameOver() && (
          <div>
            <div className="mb-4">{getDisplayWord()}</div>
            <div className="flex flex-wrap">
              {Array.from(Array(26).keys()).map((i) => (
                <button
                  key={i}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded mr-2 mb-2"
                  onClick={() => handleGuess(String.fromCharCode(65 + i).toLowerCase())}
                  disabled={isGameOver()}
                >
                  {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>
            <p className="mt-4">Remaining Attempts: {remainingAttempts}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HangmanGame;
